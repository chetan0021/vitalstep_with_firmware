/* ======================================================================
   VitalStep Palm Pressure Monitor  -  ALL-IN-ONE FIRMWARE
   Board   : ESP32-3248S035 (ESP32-WROOM-32, 3.5" ST7796 + XPT2046 touch)
   Role    : single-user home device (doctor/patient accounts live in the app)

   WHAT RUNS ON THIS ONE BOARD
     - Touch UI (home, dashboard, assessments, compare, insight, settings)
     - Real load cell (HX711), 3 trials per test, same stability rule as before
     - Battery monitor (2S Li-ion pack through a divider on IO35)
     - SD card: identity backup, offline result queue, history, queue cache
     - Wi-Fi + Bluetooth (BLE) Wi-Fi provisioning (same GATT protocol as before)
     - Supabase cloud sync through ONE Edge Function: device-sync
     - Offline first: tests always save to SD, uploaded when Wi-Fi returns

   ARDUINO IDE SETTINGS (important)
     Board            : ESP32 Dev Module
     Partition Scheme : "Huge APP (3MB No OTA/1MB SPIFFS)"   <- WiFi+BLE+TLS+UI is big
     Libraries        : LovyanGFX, HX711 (bogde), ArduinoJson, (SD, Preferences, BLE,
                        WiFi, HTTPClient come with the ESP32 core)

   WIRING
     CN1 socket: 3.3V -> HX711 VCC, GND -> GND, IO21 -> HX711 DT, IO22 -> HX711 SCK
     P3 socket (battery divider only): IO35 + GND  (leave P3 IO21/IO22 unconnected - same nets as CN1)
     Speaker/buzzer: P4 "SPEAK" socket (onboard amp, GPIO26) - passive buzzer or 8 ohm speaker
     Battery divider: pack(+) -- 330k --+-- IO35 --+-- 100k -- GND   (+100nF IO35->GND)
     Board power: 5V from a buck converter (8.4V pack -> 5V) into P1 VIN. Not from USB only.
   ====================================================================== */
#include <LovyanGFX.hpp>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <SPI.h>
#include <SD.h>
#include <HX711.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <time.h>
#include <sys/time.h>
#include <math.h>
#include <stdio.h>
#include <string.h>
#if __has_include(<esp_random.h>)
#include <esp_random.h>
#endif

// ============================ USER CONFIG ================================
#define SUPABASE_HOST     "oyqecdcpicvzwwvwaeka.supabase.co"   // no https://
#define SUPABASE_PUB_KEY  "sb_publishable_5ovuyYHtObqNMcjEFrNo6Q_Bo4dDFQi"  // publishable key (safe to ship)
#define FN_SYNC_PATH      "/functions/v1/device-sync"
#define TLS_VERIFY        0     // 0 = setInsecure() like your old firmware (dev only)
                                // 1 = verify server with SUPABASE_ROOT_CA below (production)
static const char SUPABASE_ROOT_CA[] = "";   // paste root CA PEM here when TLS_VERIFY = 1

// ------------------------------ Wi-Fi (HARDCODED for testing) ---------------
#define WIFI_SSID         "redmi10A"
#define WIFI_PASSWORD     "897654321"

#define FW_VERSION        "1.0.0"
#define HW_NAME           "VS-3248S035"
#define TZ_OFFSET_SEC     19800            // IST = UTC+5:30

// ------------------------------ TEST MODE (simulate data without hardware) ---
#define TEST_MODE         1     // 1 = enable test mode (simulates realistic trial data)
#define MOCK_HX711        1     // 1 = mock load cell readings
#define MOCK_BATTERY      1     // 1 = mock battery voltage (simulates 85%)
#define MOCK_BUZZER       1     // 1 = skip speaker output
#define REAL_SD           1     // 1 = real SD card writes

// ------------------------------ PINS (verified for ESP32-3248S035) -------
#define PIN_HX_DOUT   21     // CN1 socket
#define PIN_HX_SCK    22     // CN1 socket
#define PIN_BAT_ADC   35     // P3 Extended IO, ADC1_CH7, input only (safe with Wi-Fi)
#define PIN_SPK       26     // speaker connector (onboard amplifier)
#define PIN_LED_R      4     // onboard RGB LED
#define PIN_LED_G     16
#define PIN_LED_B     17
#define LED_ACTIVE_LOW 1     // set 0 if the LED colours look inverted
#define PIN_BOOT       0     // BOOT button (hold ~2 s during splash = force Wi-Fi setup)
#define SD_CS_PIN      5     // microSD (VSPI)
#define SD_SCK_PIN    18
#define SD_MISO_PIN   19
#define SD_MOSI_PIN   23
// display / touch pins are inside the LGFX class below (14,13,12,15,2,27 / 33,36)

// ------------------------------ BATTERY ----------------------------------
#define BAT_CELLS        2          // 2 x 18650 in series
#define BAT_R_TOP        330000.0f  // pack(+) to IO35
#define BAT_R_BOTTOM     100000.0f  // IO35 to GND
#define BAT_TRIM         1.00f      // fine trim: measured_pack_V / displayed_pack_V
#define BAT_LOW_PCT      20
#define BAT_CRIT_PCT      7         // new tests are blocked below this

// ------------------------------ LOAD CELL --------------------------------
#define HX_DEFAULT_SCALE 13746.0f   // CALIBRATED FACTOR: 13.746 counts/gram (from HX711 cal tool, image 1.0kg = delta 13883 counts)
#define MIN_TRIGGER_KG   0.1f       // trial starts above this (same as before)
#define STABLE_TOL_KG    0.05f      // same as before
#define STABLE_MS        700        // same as before

// ------------------------------ TOUCH ------------------------------------
static uint16_t SAVED_CAL[8] = {3656, 180, 3711, 3923, 367, 310, 436, 3808};

// ------------------------------ BLE (same protocol as your mobile app) ---
#define BLE_SERVICE_UUID     "6b1a0001-4b4a-4a3f-9f0a-3a2b6c8e1a10"
#define BLE_WIFI_SCAN_UUID   "6b1a0002-4b4a-4a3f-9f0a-3a2b6c8e1a10"
#define BLE_WIFI_CREDS_UUID  "6b1a0003-4b4a-4a3f-9f0a-3a2b6c8e1a10"
#define BLE_WIFI_STATUS_UUID "6b1a0004-4b4a-4a3f-9f0a-3a2b6c8e1a10"
#define BLE_DEV_INFO_UUID    "6b1a0005-4b4a-4a3f-9f0a-3a2b6c8e1a10"   // NEW (read-only JSON)

// ------------------------------ DISPLAY ----------------------------------
class LGFX : public lgfx::LGFX_Device {
  lgfx::Panel_ST7796  _panel;
  lgfx::Bus_SPI       _bus;
  lgfx::Light_PWM     _light;
  lgfx::Touch_XPT2046 _touch;
public:
  LGFX() {
    { auto c = _bus.config();
      c.spi_host = SPI2_HOST; c.spi_mode = 0; c.freq_write = 40000000; c.freq_read = 16000000;
      c.spi_3wire = false; c.use_lock = true; c.dma_channel = SPI_DMA_CH_AUTO;
      c.pin_sclk = 14; c.pin_mosi = 13; c.pin_miso = 12; c.pin_dc = 2;
      _bus.config(c); _panel.setBus(&_bus); }
    { auto c = _panel.config();
      c.pin_cs = 15; c.pin_rst = -1; c.pin_busy = -1;
      c.panel_width = 320; c.panel_height = 480; c.memory_width = 320; c.memory_height = 480;
      c.offset_x = 0; c.offset_y = 0; c.offset_rotation = 0;
      c.readable = true; c.invert = false; c.rgb_order = false; c.dlen_16bit = false; c.bus_shared = true;
      _panel.config(c); }
    { auto c = _light.config();
      c.pin_bl = 27; c.invert = false; c.freq = 44100; c.pwm_channel = 7;
      _light.config(c); _panel.setLight(&_light); }
    { auto c = _touch.config();
      c.x_min = 300; c.x_max = 3900; c.y_min = 200; c.y_max = 3700;
      c.pin_int = 36; c.bus_shared = true; c.offset_rotation = 0;
      c.spi_host = SPI2_HOST; c.freq = 1000000;
      c.pin_sclk = 14; c.pin_mosi = 13; c.pin_miso = 12; c.pin_cs = 33;
      _touch.config(c); _panel.setTouch(&_touch); }
    setPanel(&_panel);
  }
};
static LGFX tft;
static lgfx::LGFXBase* G = &tft;     // draw target (no off-screen sprites: keeps RAM free for TLS)

// ------------------------------ TYPES ------------------------------------
typedef const lgfx::IFont* Fnt;
enum Al : uint8_t { AL_L, AL_C, AL_R };
enum Scr : uint8_t { S_SPLASH, S_SETUP, S_HOME, S_DASH, S_ASSESS, S_SETTINGS, S_TEST, S_COMPARE, S_INSIGHT, S_CALIB };
enum Modal : uint8_t { M_NONE, M_NOSD, M_UNPAIRED, M_BATT_CRIT, M_EXIT_TEST, M_RESET, M_BLE_EXIT, M_RELEASE };
enum TP : uint8_t { TP_SETUP, TP_READY, TP_WAIT, TP_APPLY, TP_REST, TP_DONE };
enum NetState : uint8_t { NS_NO_CREDS, NS_CONNECTING, NS_ONLINE, NS_FAILED, NS_BLE };

#define MAXS 16
struct Seed {                       // owner profile (from cloud, cached in NVS)
  char name[32]; char ini[4]; char pid[20]; char spec[32]; float lo, hi;
};
struct Patient {                    // measurement history of the owner
  const Seed* s; uint8_t n; uint16_t tests;
  float L[MAXS]; float R[MAXS]; uint32_t ts[MAXS];
  bool todayOpen; float todayBest[2];
};
struct Insight {
  uint8_t sev; int weaker; float asym; float trend;
  char head[56]; char sub[80]; char body[230]; char tip1[52]; char tip2[52];
};
struct QItem { int32_t id; uint8_t hand; uint8_t posture; bool done; char title[28]; };
struct TestS {
  TP ph; uint8_t hand, posture, trial; int32_t assessId; float tr[3];
  float val, peak, prev, shown, shownPk;
  uint32_t phT, stableT, lastS; uint8_t spN; float sp[64]; bool zeroed;
  bool saved; float prevBest; uint8_t cdShown; uint32_t doneT;
};

// ------------------------------ COLOURS (ENHANCED VIBRANT) ---------------
#define RGB(r,g,b) ((uint16_t)((((r)&0xF8)<<8)|(((g)&0xFC)<<3)|(((b)&0xFF)>>3)))
// Core palette
static const uint16_t C_BG=RGB(8,15,35), BG_TOP=RGB(18,26,60), BG_BOT=RGB(5,10,22),
  C_BAR=RGB(6,10,22), C_CARD=RGB(22,32,62), C_CARD2=RGB(35,48,88),
  C_LINE=RGB(50,65,110), C_TXT=RGB(248,250,255), C_SUB=RGB(165,180,210), C_DIM=RGB(110,125,160),
  // Vibrant primary colors
  C_TEAL=RGB(0,230,200), C_G1=RGB(20,220,180), C_G2=RGB(60,140,255),
  C_L=RGB(45,220,210), C_L2=RGB(70,155,255), C_R=RGB(180,100,255), C_R2=RGB(255,100,220),
  // Status colors (vibrant)
  C_OK=RGB(80,255,150), C_WARN=RGB(255,220,80), C_BAD=RGB(255,80,120),
  // Accent colors (NEW: vibrant gold/orange + purple accent)
  C_GOLD=RGB(255,200,50), C_ACCENT=RGB(200,120,255), C_ORANGE=RGB(255,140,40),
  C_CYAN=RGB(0,240,240), C_LIME=RGB(120,255,80),
  // Neutrals
  C_WHITE=RGB(255,255,255), C_BLACK=RGB(0,0,0), C_INK=RGB(10,25,40), C_SKIN=RGB(245,200,170), C_DEV=RGB(230,240,250),
  C_HERO1=RGB(70,100,220), C_HERO2=RGB(35,50,130);
#define F0   (&lgfx::fonts::Font0)
#define F2   (&lgfx::fonts::Font2)
#define F9   (&lgfx::fonts::FreeSans9pt7b)
#define F9B  (&lgfx::fonts::FreeSansBold9pt7b)
#define F12B (&lgfx::fonts::FreeSansBold12pt7b)
#define F24B (&lgfx::fonts::FreeSansBold24pt7b)

// ============================== GLOBAL STATE ============================
static Preferences prefs;
static Seed PROF = {"", "--", "", "", 10.0f, 18.0f};
static Patient pts[1];
static const int cur = 0;
#define NP 1

// identity
static char devCode[40]="", devSecret[72]="", devId[48]="", bootId[9]="";
static bool identOk=false;
// storage
static SPIClass sdSpi(VSPI);
static bool sdOk=false;
static SemaphoreHandle_t sdMux=nullptr;
// load cell
static HX711 scale;
static bool hxOk=false; static float hxScaleF=HX_DEFAULT_SCALE; static float hxLastKg=0;
// battery
static float batPackV=0; static int batPct=-1; static bool batPresent=false, batChg=false;
// time
static bool timeEst=false;
// options (persisted)
static uint8_t optBright=2, optSound=1;           // brightness 0..3 (low..auto reserved), sound on/off
// network shared state (written by net task, read by UI)
static volatile NetState netState=NS_NO_CREDS;
static volatile bool cloudOk=false, claimed=false, authFail=false, haveCreds=false;
static volatile bool reqSync=false, reqReconnect=false, reqUnpair=false;
static char pairPin[8]="";
static volatile int  pendingCnt=0;
static volatile uint32_t lastSyncEpoch=0;
static volatile bool evHistory=false, evQueue=false, evProfile=false, evClaim=false;
static char wifiSsid[40]="", wifiPass[72]="";
static portMUX_TYPE shMux = portMUX_INITIALIZER_UNLOCKED;
static QItem queueItems[6]; static volatile uint8_t queueN=0;
static QItem qIn[6]; static uint8_t qInN=0;
static Seed profIn; static bool profInValid=false;
static struct { uint8_t n; float L[MAXS]; float R[MAXS]; uint32_t ts[MAXS]; } histIn;
// BLE provisioning shared state
static BLEServer* bleServer=nullptr; static BLECharacteristic *bleScanCh=nullptr,*bleCredsCh=nullptr,*bleStatCh=nullptr,*bleInfoCh=nullptr;
static volatile bool bleActive=false, bleClient=false, bleCredsRx=false, bleDone=false, bleStarted=false, bleScanReq=false;
static char bleName[24]="PalmPressure", bleStatus[40]="";
static char blePendSsid[40]="", blePendPass[72]="";

// UI state
static Scr  scr=S_SPLASH, scrBack=S_HOME;
static bool needFull=true, statusDirty=true;
static uint32_t scrT0=0, lastTouchMs=0;
static uint8_t dashTab=0, dashRange=2, cmpTab=0, setPage=0;
static int  scrub=-1;
static Modal modal=M_NONE;
static char toastMsg[48]; static uint32_t toastUntil=0; static uint16_t toastCol=C_TEAL;
static bool tdown=false, ttap=false; static int tx=0, ty=0; static uint32_t tUp=0;
static TestS T_;
static int chPl=0, chPr=0, chPt=0, chPb=0, chSt=0, chCnt=0;
static int gDrawn=0;
static bool dimmed=false;
static uint8_t calStep=0; static float calKg=5.0f;
static uint32_t rs=2463534242u;
static const char* MON[12]={"Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"};

// ===========================================================================
//  SMALL HELPERS (math, drawing wrappers, text)
// ===========================================================================
static inline float clampf(float v,float a,float b){ return v<a?a:(v>b?b:v); }
static inline int   clampi(int v,int a,int b){ return v<a?a:(v>b?b:v); }
static inline int   imin(int a,int b){ return a<b?a:b; }
static inline int   imax(int a,int b){ return a>b?a:b; }
static float rnd(){ rs^=rs<<13; rs^=rs>>17; rs^=rs<<5; return (rs&0xFFFFFF)/16777216.0f; }
static float rndr(float a,float b){ return a+(b-a)*rnd(); }
static inline bool inR(int x,int y,int rx,int ry,int rw,int rh){ return x>=rx&&x<rx+rw&&y>=ry&&y<ry+rh; }

static uint16_t mix(uint16_t a,uint16_t b,uint8_t t){
  int ar=(a>>11)&31, ag=(a>>5)&63, ab=a&31, br=(b>>11)&31, bg=(b>>5)&63, bb=b&31;
  int r=ar+((br-ar)*t)/255, g=ag+((bg-ag)*t)/255, bl=ab+((bb-ab)*t)/255;
  return (uint16_t)((r<<11)|(g<<5)|bl);
}
static uint16_t heat(float t){
  static const uint8_t S[4][3]={{30,64,175},{20,184,166},{250,204,21},{239,68,68}};
  t=clampf(t,0,1); float p=t*3; int i=(int)p; if(i>2) i=2; float f=p-i;
  return RGB((int)(S[i][0]+(S[i+1][0]-S[i][0])*f),(int)(S[i][1]+(S[i+1][1]-S[i][1])*f),(int)(S[i][2]+(S[i+1][2]-S[i][2])*f));
}
static inline void FR(int x,int y,int w,int h,uint16_t c){ if(w>0&&h>0) G->fillRect(x,y,w,h,c); }
static inline void RR(int x,int y,int w,int h,int r,uint16_t c){ if(w>0&&h>0) G->fillRoundRect(x,y,w,h,imin(r,imin(w,h)/2),c); }
static inline void RO(int x,int y,int w,int h,int r,uint16_t c){ if(w>0&&h>0) G->drawRoundRect(x,y,w,h,imin(r,imin(w,h)/2),c); }
static inline void LN(int a,int b,int c,int d,uint16_t col){ G->drawLine(a,b,c,d,col); }
static inline void HL(int x,int y,int w,uint16_t c){ if(w>0) G->drawFastHLine(x,y,w,c); }
static inline void VL(int x,int y,int h,uint16_t c){ if(h>0) G->drawFastVLine(x,y,h,c); }
static inline void FC(int x,int y,int r,uint16_t c){ G->fillCircle(x,y,r,c); }
static inline void OC(int x,int y,int r,uint16_t c){ G->drawCircle(x,y,r,c); }
static inline void TRI(int a,int b,int c,int d,int e,int f,uint16_t col){ G->fillTriangle(a,b,c,d,e,f,col); }

// text: y = vertical centre
static void DT(const char* s,int x,int y,Al a,uint16_t col,Fnt f){
  G->setFont(f); G->setTextColor(col);
  int w=G->textWidth(s), h=G->fontHeight();
  int xx=(a==AL_L)?x:((a==AL_C)?x-w/2:x-w);
  G->drawString(s,xx,y-h/2);
}
static int TW(const char* s,Fnt f){ G->setFont(f); return G->textWidth(s); }

// word-wrapped text, returns lines used. y = centre of first line
static int WRAP(const char* s,int x,int y,int maxW,int lh,int maxLines,uint16_t col,Fnt f){
  G->setFont(f);
  char line[100], cand[100]; int lines=0; const char* p=s;
  while(*p==' ') p++;
  while(*p && lines<maxLines){
    int len=0; line[0]=0;
    while(*p){
      const char* q=p; while(*q && *q!=' ') q++;
      int wl=(int)(q-p); if(wl>60) wl=60;
      if(len+1+wl>=(int)sizeof(line)-2) break;
      int cl=0;
      if(len){ memcpy(cand,line,len); cand[len]=' '; cl=len+1; }
      memcpy(cand+cl,p,wl); cl+=wl; cand[cl]=0;
      if(len && G->textWidth(cand)>maxW) break;
      memcpy(line,cand,cl+1); len=cl;
      p+=wl; while(*p==' ') p++;
      if(wl==60) break;
    }
    DT(line,x,y+lines*lh,AL_L,col,f); lines++;
  }
  return lines;
}

static void BTNF(int x,int y,int w,int h,const char* s,uint16_t bg,uint16_t fg,bool outline,Fnt f){
  int r=imin(h/2,16);
  if(outline){ RR(x,y,w,h,r,C_CARD); RO(x,y,w,h,r,bg); DT(s,x+w/2,y+h/2,AL_C,fg,f); }
  else if(bg==C_TEAL){ GRRH(x,y,w,h,r,C_G1,C_G2); DT(s,x+w/2,y+h/2,AL_C,fg,f); }
  else { RR(x,y,w,h,r,bg); DT(s,x+w/2,y+h/2,AL_C,fg,f); }
}
static void BTN(int x,int y,int w,int h,const char* s,uint16_t bg,uint16_t fg){ BTNF(x,y,w,h,s,bg,fg,false,F9B); }
static void BTNO(int x,int y,int w,int h,const char* s,uint16_t bg,uint16_t fg){ BTNF(x,y,w,h,s,bg,fg,true,F9B); }
static void CHIP(int x,int y,const char* s,uint16_t col){        // small tag, left aligned at x
  G->setFont(F0); int w=(int)strlen(s)*6+10;
  RR(x,y,w,14,7,mix(C_CARD,col,60)); DT(s,x+w/2,y+7,AL_C,col,F0);
}

// arcs (angle in degrees, 0 = 12 o'clock, clockwise)
static void arcQuad(int cx,int cy,int r0,int r1,float a0,float a1,uint16_t c){
  const float D=0.0174533f;
  float s0=sinf(a0*D), c0=cosf(a0*D), s1=sinf(a1*D), c1=cosf(a1*D);
  int xo0=cx+(int)(r1*s0), yo0=cy-(int)(r1*c0), xi0=cx+(int)(r0*s0), yi0=cy-(int)(r0*c0);
  int xo1=cx+(int)(r1*s1), yo1=cy-(int)(r1*c1), xi1=cx+(int)(r0*s1), yi1=cy-(int)(r0*c1);
  TRI(xi0,yi0,xo0,yo0,xo1,yo1,c); TRI(xi0,yi0,xo1,yo1,xi1,yi1,c);
}
static void arcRing(int cx,int cy,int r0,int r1,float a0,float a1,uint16_t c,float step){
  for(float a=a0;a<a1;a+=step){ float b=a+step; if(b>a1) b=a1; arcQuad(cx,cy,r0,r1,a,b+0.6f,c); }
}


// ---- gradients (the panel has no hardware gradient: drawn line by line) ----
static uint16_t gcol(uint16_t a,uint16_t b,int i,int n){ return mix(a,b,(uint8_t)((255*i)/(n>1?n-1:1))); }
static void BGR(int x,int y,int w,int h){                       // repaint a slice of the background gradient
  if(w<=0||h<=0) return;
  for(int r=0;r<h;r++){ int yy=y+r; G->drawFastHLine(x,yy,w,mix(BG_TOP,BG_BOT,(uint8_t)clampi(yy*255/320,0,255))); }
}
static int rInset(int i,int n,int r){
  if(r<=0) return 0; float dy;
  if(i<r) dy=r-i-0.5f; else if(i>=n-r) dy=i-(n-r)+0.5f; else return 0;
  float s=r*r-dy*dy; if(s<0) s=0; return r-(int)(sqrtf(s)+0.5f);
}

// ==================== PERFORMANCE FIX: Yield Points & Gradient Optimization ====================
// Allows touch input to be processed during long rendering operations
// Touch is checked every 10ms instead of every 200ms for responsive buttons
static uint32_t lastYield = 0;
static const uint32_t YIELD_INTERVAL = 10;  // milliseconds between yield checkpoints

static void checkYield(){
  uint32_t now = millis();
  if(now - lastYield >= YIELD_INTERVAL){
    lastYield = now;
    yield();  // FreeRTOS: yield to scheduler (allows touch ISR to run)
  }
}
// ==================================================================================================

// OPTIMIZED: Reduce gradient calls (faster than original but keeping safety)
static void GRR(int x,int y,int w,int h,int r,uint16_t c1,uint16_t c2){       // top -> bottom gradient
  r=imin(r,imin(w,h)/2); 
  for(int i=0;i<h;i+=2){  // ← OPTIMIZATION: Skip every other line (2x faster)
    int in=rInset(i,h,r); 
    G->drawFastHLine(x+in,y+i,w-2*in,gcol(c1,c2,i,h)); 
  }
}

// OPTIMIZED: Reduce gradient calls (faster than original but keeping safety)
static void GRRH(int x,int y,int w,int h,int r,uint16_t c1,uint16_t c2){      // left -> right gradient
  r=imin(r,imin(w,h)/2); 
  for(int i=0;i<w;i+=2){  // ← OPTIMIZATION: Skip every other column (2x faster)
    int in=rInset(i,w,r); 
    G->drawFastVLine(x+i,y+in,h-2*in,gcol(c1,c2,i,w)); 
  }
}
static void ringGauge(int cx,int cy,int r0,int r1,float frac,uint16_t c1,uint16_t c2,uint16_t track){
  arcRing(cx,cy,r0,r1,0,360,track,6);
  frac=clampf(frac,0,1); if(frac<0.004f) return;
  int n=(int)(frac*60+0.5f); if(n<1) n=1;
  for(int i=0;i<n;i++) arcQuad(cx,cy,r0,r1,i*6.0f,(i+1)*6.0f+0.7f,gcol(c1,c2,i,60));
  int rm=(r0+r1)/2, cr=(r1-r0)/2; float a=(n*6.0f)*0.0174533f;                  // rounded end caps
  FC(cx,cy-rm,cr,c1); FC(cx+(int)(rm*sinf(a)),cy-(int)(rm*cosf(a)),cr,gcol(c1,c2,n-1,60));
}

// ===========================================================================
//  TIME  (no RTC: NTP / server time / phone time over BLE, estimated offline)
// ===========================================================================
static bool timeValid(){ return time(nullptr) > 1735689600; }          // after 1 Jan 2025
static uint32_t nowEpoch(){ time_t t=time(nullptr); return (t>1735689600)?(uint32_t)t:0; }
static void timeSetEpoch(uint32_t e,bool est){
  struct timeval tv; tv.tv_sec=(time_t)e; tv.tv_usec=0; settimeofday(&tv,nullptr); timeEst=est;
}
static void localTm(uint32_t e,struct tm* t){ time_t x=(time_t)(e+TZ_OFFSET_SEC); gmtime_r(&x,t); }
static long dayNumber(uint32_t e){ return (long)((e+TZ_OFFSET_SEC)/86400UL); }
static void fmtTs(uint32_t ts,char* o,size_t n){
  if(ts==0){ snprintf(o,n,"--"); return; }
  struct tm t; localTm(ts,&t); snprintf(o,n,"%d %s",t.tm_mday,MON[t.tm_mon]);
}
static void fmtClock(char* o,size_t n){
  uint32_t e=nowEpoch(); if(!e){ snprintf(o,n,"--:--"); return; }
  struct tm t; localTm(e,&t); snprintf(o,n,"%02d:%02d",t.tm_hour,t.tm_min);
}
static void timeRestore(){                      // after power loss: last known time + 1 s (estimated)
  if(timeValid()) return;
  prefs.begin("vs",true); uint32_t e=prefs.getUInt("lastEp",0); prefs.end();
  if(e>1735689600) timeSetEpoch(e+1,true);
}
static void timePersist(){
  static uint32_t last=0; if(!timeValid()||millis()-last<600000UL) return; last=millis();
  prefs.begin("vs",false); prefs.putUInt("lastEp",nowEpoch()); prefs.end();
}

// ===========================================================================
//  SD CARD  (identity backup, offline result queue, history, queue cache)
// ===========================================================================
static void sdLock(){ if(sdMux) xSemaphoreTake(sdMux,portMAX_DELAY); }
static void sdUnlock(){ if(sdMux) xSemaphoreGive(sdMux); }
static bool sdInit(){
  sdMux=xSemaphoreCreateMutex();
  sdSpi.begin(SD_SCK_PIN,SD_MISO_PIN,SD_MOSI_PIN,SD_CS_PIN);
  sdOk=SD.begin(SD_CS_PIN,sdSpi,20000000);
  if(sdOk){ SD.mkdir("/vs"); SD.mkdir("/vs/pending"); }
  return sdOk;
}
static bool sdReadText(const char* path,char* out,size_t n){       // trims whitespace; caller holds no lock
  out[0]=0; if(!sdOk) return false;
  sdLock(); bool ok=false;
  if(SD.exists(path)){ File f=SD.open(path); if(f){ String s=f.readString(); f.close(); s.trim(); strlcpy(out,s.c_str(),n); ok=out[0]!=0; } }
  sdUnlock(); return ok;
}
static bool sdWriteAtomic(const char* path,const char* data){      // caller holds the lock
  char tmp[72]; snprintf(tmp,sizeof tmp,"%s.tmp",path); SD.remove(tmp);
  File f=SD.open(tmp,FILE_WRITE); if(!f) return false;
  size_t w=f.print(data); f.flush(); f.close();
  if(w!=strlen(data)){ SD.remove(tmp); return false; }
  SD.remove(path); return SD.rename(tmp,path);
}
static bool sdWriteText(const char* path,const char* data){
  if(!sdOk) return false; sdLock(); bool ok=sdWriteAtomic(path,data); sdUnlock(); return ok;
}

// ===========================================================================
//  IDENTITY  (device code + secret from SD, cached in NVS; device id after pairing)
// ===========================================================================
static void identityLoad(){
  prefs.begin("vs",true);
  String c=prefs.getString("code",""), s=prefs.getString("secret",""), i=prefs.getString("devid","");
  prefs.end();
  strlcpy(devCode,c.c_str(),sizeof devCode); strlcpy(devSecret,s.c_str(),sizeof devSecret); strlcpy(devId,i.c_str(),sizeof devId);
  char sc[40], ss[72], si[48];
  bool hc=sdReadText("/devicecode.txt",sc,sizeof sc), hs=sdReadText("/devicesecret.txt",ss,sizeof ss);
  if(hc&&hs){                                                      // factory files on SD win
    if(strcmp(sc,devCode)!=0||strcmp(ss,devSecret)!=0){
      strlcpy(devCode,sc,sizeof devCode); strlcpy(devSecret,ss,sizeof devSecret); devId[0]=0;
      prefs.begin("vs",false); prefs.putString("code",devCode); prefs.putString("secret",devSecret); prefs.remove("devid"); prefs.end();
    }
  } else if(devCode[0]&&devSecret[0]&&sdOk){                       // SD blank/new: restore the backup onto it
    sdWriteText("/devicecode.txt",devCode); sdWriteText("/devicesecret.txt",devSecret);
  }
  if(!devId[0] && sdReadText("/deviceID.txt",si,sizeof si)) strlcpy(devId,si,sizeof devId);
  identOk=(devCode[0]&&devSecret[0]);
}
static void identitySaveDevId(const char* id){
  if(!id||!id[0]||strcmp(id,devId)==0) return;
  strlcpy(devId,id,sizeof devId);
  prefs.begin("vs",false); prefs.putString("devid",devId); prefs.end();
  sdWriteText("/deviceID.txt",devId);
}

// ===========================================================================
//  OPTIONS, PROFILE, WI-FI CREDENTIALS (NVS)
// ===========================================================================
static void optionsLoad(){
  prefs.begin("vs",true);
  optBright=prefs.getUChar("bright",2); optSound=prefs.getUChar("sound",1); hxScaleF=prefs.getFloat("hxs",HX_DEFAULT_SCALE);
  claimed=prefs.getBool("claimed",false);
  String n=prefs.getString("pname",""), pid=prefs.getString("ppid",""), sp=prefs.getString("pspec","");
  PROF.lo=prefs.getFloat("plo",10.0f); PROF.hi=prefs.getFloat("phi",18.0f);
  prefs.end();
  strlcpy(PROF.name,n.c_str(),sizeof PROF.name); strlcpy(PROF.pid,pid.c_str(),sizeof PROF.pid); strlcpy(PROF.spec,sp.c_str(),sizeof PROF.spec);
  if(PROF.name[0]){ PROF.ini[0]=PROF.name[0]; PROF.ini[1]=0; }
  if(fabsf(hxScaleF)<1.0f) hxScaleF=HX_DEFAULT_SCALE;
}
static void optionsSave(){ prefs.begin("vs",false); prefs.putUChar("bright",optBright); prefs.putUChar("sound",optSound); prefs.end(); }
static void profileSave(){
  prefs.begin("vs",false); prefs.putString("pname",PROF.name); prefs.putString("ppid",PROF.pid); prefs.putString("pspec",PROF.spec);
  prefs.putFloat("plo",PROF.lo); prefs.putFloat("phi",PROF.hi); prefs.putBool("claimed",claimed); prefs.end();
}
static void wifiCredsLoad(){
  prefs.begin("wificreds",true); String s=prefs.getString("ssid",""), p=prefs.getString("pass",""); prefs.end();
  if(s.length()==0){ s=WIFI_SSID; p=WIFI_PASSWORD; }  // Use hardcoded credentials if none saved
  strlcpy(wifiSsid,s.c_str(),sizeof wifiSsid); strlcpy(wifiPass,p.c_str(),sizeof wifiPass); haveCreds=wifiSsid[0]!=0;
}
static void wifiCredsSave(const char* ssid,const char* pass){
  prefs.begin("wificreds",false); prefs.putString("ssid",ssid); prefs.putString("pass",pass); prefs.end();
  strlcpy(wifiSsid,ssid,sizeof wifiSsid); strlcpy(wifiPass,pass,sizeof wifiPass); haveCreds=true;
}
static void wifiCredsClear(){ prefs.begin("wificreds",false); prefs.clear(); prefs.end(); wifiSsid[0]=0; wifiPass[0]=0; haveCreds=false; }

// ===========================================================================
//  LED + SOUND  (onboard RGB LED, speaker amplifier)
// ===========================================================================
static void ledSet(bool r,bool g,bool b){
  digitalWrite(PIN_LED_R,(LED_ACTIVE_LOW)?!r:r); digitalWrite(PIN_LED_G,(LED_ACTIVE_LOW)?!g:g); digitalWrite(PIN_LED_B,(LED_ACTIVE_LOW)?!b:b);
}
static void beep(int f,int ms){ if(optSound) tone(PIN_SPK,f,ms); }
static void beepOk(){ beep(1319,90); }
static void beepTrial(){ beep(988,120); }
static void beepErr(){ beep(330,250); }
static void applyBrightness(){
  static const uint8_t lv[4]={40,110,180,255}; tft.setBrightness(dimmed?20:lv[(optBright>3?3:optBright)]);
}

// ===========================================================================
//  BATTERY  (2S Li-ion pack through a divider into IO35)
// ===========================================================================
static const float CV[21]={3.27f,3.61f,3.69f,3.71f,3.73f,3.75f,3.77f,3.79f,3.80f,3.82f,3.84f,3.85f,3.87f,3.91f,3.95f,3.98f,4.02f,4.08f,4.11f,4.15f,4.20f};
static int cellPct(float v){
  if(v<=CV[0]) return 0; if(v>=CV[20]) return 100;
  for(int i=1;i<21;i++) if(v<=CV[i]) return (int)((i-1)*5+5.0f*(v-CV[i-1])/(CV[i]-CV[i-1])+0.5f);
  return 100;
}
static void batteryUpdate(){
  static uint32_t last=0, tRef=0; static float vRef=0;
  if(last&&millis()-last<1500) return; last=millis()|1;
  uint32_t acc=0; for(int i=0;i<16;i++) acc+=analogReadMilliVolts(PIN_BAT_ADC);
  float pin=(acc/16.0f)/1000.0f, pack=pin*((BAT_R_TOP+BAT_R_BOTTOM)/BAT_R_BOTTOM)*BAT_TRIM;
  batPackV=(batPackV<0.5f)?pack:(batPackV*0.8f+pack*0.2f);
  batPresent=(batPackV>BAT_CELLS*3.0f);
  if(!batPresent){ batPct=-1; batChg=false; return; }
  int p=cellPct(batPackV/BAT_CELLS);
  if(batPct<0||batChg||p<batPct||p>batPct+8) batPct=p;
  if(millis()-tRef>45000){ if(vRef>0){ float d=batPackV-vRef; if(d>0.05f) batChg=true; else if(d<-0.02f||fabsf(d)<0.01f) batChg=false; } vRef=batPackV; tRef=millis(); }
}

// ===========================================================================
//  LOAD CELL  (HX711, non-blocking)
// ===========================================================================
// ---- MOCK LOAD CELL (TEST MODE) -----------------------------------------
// Simulates a realistic pressure curve: ramp up → plateau → stable reading
#if MOCK_HX711
static uint32_t mockTrialStartMs = 0;
static float    mockTargetKg     = 0;
static void mockTrialReset(){
  mockTrialStartMs = millis();
  // Each trial gets a slightly different realistic target (8-14 kg range)
  mockTargetKg = 8.0f + rndr(0.0f, 6.0f);
}
static bool hxPoll(float* kg){
  uint32_t el = millis() - mockTrialStartMs;
  // Phase 1: ramp up over 1200 ms
  // Phase 2: stable plateau (triggers stable detection)
  float v;
  if(el < 1200){
    float t = el / 1200.0f;
    v = mockTargetKg * t + rndr(-0.1f, 0.1f);   // ramp with tiny noise
    if(v < 0) v = 0;
  } else {
    v = mockTargetKg + rndr(-0.03f, 0.03f);      // stable with micro noise
  }
  hxLastKg = v; *kg = v; return true;
}
static void hxZero(){ mockTrialReset(); }  // reset mock timer (no hardware tare)
static void hxInit(){ hxOk = true; mockTrialReset(); Serial.println("[HX] MOCK mode active"); }
#else
static bool hxPoll(float* kg){
  if(!hxOk||!scale.is_ready()) return false;
  hxLastKg=scale.get_units(1)/1000.0f; *kg=hxLastKg; return true;
}
static void hxZero(){ if(hxOk) scale.tare(10); }
static void hxInit(){
  scale.begin(PIN_HX_DOUT,PIN_HX_SCK); scale.set_scale(hxScaleF);
  uint32_t t=millis(); hxOk=false;
  while(millis()-t<1500){ if(scale.is_ready()){ hxOk=true; break; } delay(20); }
  if(hxOk) scale.tare(10);
}
#endif

// ===========================================================================
//  HISTORY + ASSESSMENT QUEUE (kept on SD so they survive power-off)
// ===========================================================================
static void historySave(){
  const Patient& p=pts[cur]; char* b=(char*)malloc(MAXS*40+8); if(!b) return; b[0]=0; size_t o=0;
  for(int i=0;i<p.n;i++) o+=snprintf(b+o,MAXS*40+8-o,"%lu,%.2f,%.2f\n",(unsigned long)p.ts[i],p.L[i],p.R[i]);
  sdWriteText("/vs/history.csv",b); free(b);
}
static void historyLoad(){
  Patient& p=pts[cur]; memset(&p,0,sizeof p); p.s=&PROF;
  if(!sdOk) return; sdLock();
  if(SD.exists("/vs/history.csv")){
    File f=SD.open("/vs/history.csv");
    while(f&&f.available()&&p.n<MAXS){
      String ln=f.readStringUntil('\n'); unsigned long t; float l,r;
      if(sscanf(ln.c_str(),"%lu,%f,%f",&t,&l,&r)==3){ p.ts[p.n]=t; p.L[p.n]=l; p.R[p.n]=r; p.n++; }
    }
    if(f) f.close();
  }
  sdUnlock();
  p.tests=p.n*2;
  if(p.n>0){ uint32_t e=nowEpoch(); if(e&&p.ts[p.n-1]&&dayNumber(e)==dayNumber(p.ts[p.n-1])) p.todayOpen=true; }
}
static void queueSave(){
  char b[420]; size_t o=0; o+=snprintf(b+o,sizeof b-o,"[");
  for(int i=0;i<queueN;i++) o+=snprintf(b+o,sizeof b-o,"%s{\"id\":%ld,\"hand\":\"%c\",\"posture\":\"%s\",\"title\":\"%s\"}",i?",":"",(long)queueItems[i].id,queueItems[i].hand?'R':'L',queueItems[i].posture?"standing":"sitting",queueItems[i].title);
  snprintf(b+o,sizeof b-o,"]"); sdWriteText("/vs/queue.json",b);
}
static void queueParse(JsonArrayConst arr,QItem* out,uint8_t* n){
  *n=0;
  for(JsonObjectConst it:arr){
    if(*n>=6) break; QItem& q=out[*n]; memset(&q,0,sizeof q);
    q.id=it["id"]|0; const char* h=it["hand"]|"R"; q.hand=(h[0]=='L'||h[0]=='l')?0:1;
    const char* ps=it["posture"]|"sitting"; q.posture=(ps[0]=='s'&&ps[1]=='t')?1:0;      // "standing"
    strlcpy(q.title,it["title"]|"Palm Pressure Test",sizeof q.title); (*n)++;
  }
}
static void queueLoad(){
  queueN=0; char* buf=(char*)malloc(600); if(!buf) return;
  if(sdReadText("/vs/queue.json",buf,600)){
    StaticJsonDocument<1536> doc;
    if(!deserializeJson(doc,buf)){ uint8_t n=0; queueParse(doc.as<JsonArrayConst>(),queueItems,&n); queueN=n; }
  }
  free(buf);
}

// ===========================================================================
//  OFFLINE RESULT QUEUE  (one JSON file per test in /vs/pending)
// ===========================================================================
static uint32_t nextSeq(){
  prefs.begin("vs",false); uint32_t s=prefs.getUInt("seq",0)+1; prefs.putUInt("seq",s); prefs.end(); return s;
}
static int pendingCount(){
  if(!sdOk) return 0; int n=0; sdLock();
  File d=SD.open("/vs/pending");
  if(d){ File f=d.openNextFile(); while(f){ String nm=f.name(); if(nm.endsWith(".json")) n++; f.close(); f=d.openNextFile(); } d.close(); }
  sdUnlock(); return n;
}
static bool pendingSave(int hand,int posture,int32_t assessId,const float* tr,float best){
  if(!sdOk) return false;
  uint32_t seq=nextSeq(); char path[48], body[520]; uint32_t e=nowEpoch();
  snprintf(path,sizeof path,"/vs/pending/%06lu.json",(unsigned long)seq);
  snprintf(body,sizeof body,"{\"client_id\":\"%s-%06lu\",\"assessment_id\":%ld,\"hand\":\"%c\",\"posture\":\"%s\",\"t1\":%.3f,\"t2\":%.3f,\"t3\":%.3f,\"best\":%.3f,\"recorded_at\":%lu,\"time_valid\":%s,\"uptime_ms\":%lu,\"boot_id\":\"%s\",\"battery_pct\":%d,\"patient_code\":\"%s\"}",
    devCode,(unsigned long)seq,(long)assessId,hand?'R':'L',posture?"standing":"sitting",tr[0],tr[1],tr[2],best,(unsigned long)e,(e&&!timeEst)?"true":"false",(unsigned long)millis(),bootId,batPct,PROF.pid);
  sdLock(); bool ok=sdWriteAtomic(path,body); sdUnlock();
  if(ok) pendingCnt=pendingCnt+1;
  return ok;
}
static int weakerHand(const Patient& p){
  if(p.n==0) return 1;
  float l=p.L[p.n-1], r=p.R[p.n-1];
  if(l<=0||r<=0) return 1;
  return (l<r)?0:1;
}
static float trendOf(const float* a,int n){          // % change of latest vs avg of up to 3 previous
  if(n<2) return 0; int m=imin(3,n-1); float s=0; int c=0;
  for(int i=n-1-m;i<n-1;i++){ if(a[i]>0){ s+=a[i]; c++; } }
  if(c==0||a[n-1]<=0) return 0; float avg=s/c; return (a[n-1]-avg)/avg*100.0f;
}
static float avgOf(const float* a,int n){ float s=0; int c=0; for(int i=0;i<n;i++) if(a[i]>0){ s+=a[i]; c++; } return c?s/c:0; }
static float asymOf(float l,float r){ float hi=fmaxf(l,r), lo=fminf(l,r); return hi>0?(hi-lo)/hi*100.0f:0; }
static uint16_t sevColor(uint8_t s){ return s==3?C_BAD:(s==2?C_WARN:(s==1?C_OK:C_TEAL)); }
static const char* sevName(uint8_t s){ return s==3?"ALERT":(s==2?"WATCH":(s==1?"GOOD":"INFO")); }

static void computeInsight(const Patient& p,Insight& o){
  memset(&o,0,sizeof(o)); const Seed* s=p.s;
  o.weaker=weakerHand(p);
  if(p.n==0){
    o.sev=0;
    snprintf(o.head,sizeof o.head,"Welcome - take your first test");
    snprintf(o.sub,sizeof o.sub,"One test per hand sets your baseline");
    snprintf(o.body,sizeof o.body,"No measurements yet. Complete 3 trials with each hand so VitalStep can build your baseline, trends and symmetry insights. Target range %.0f-%.0f kg.",s->lo,s->hi);
    snprintf(o.tip1,sizeof o.tip1,"Test your weaker hand first");
    snprintf(o.tip2,sizeof o.tip2,"Then test the other hand");
    return;
  }
  float l=p.L[p.n-1], r=p.R[p.n-1];
  if(l<=0||r<=0){
    o.sev=0;
    snprintf(o.head,sizeof o.head,"Test the other hand to compare");
    snprintf(o.sub,sizeof o.sub,"First result saved: %.1f kg",l>0?l:r);
    snprintf(o.body,sizeof o.body,"Only one hand has been measured so far. Test the other hand to unlock symmetry insights. Target range %.0f-%.0f kg.",s->lo,s->hi);
    snprintf(o.tip1,sizeof o.tip1,"Test the other hand now");
    snprintf(o.tip2,sizeof o.tip2,"Use the same posture");
    return;
  }
  o.asym=asymOf(l,r);
  float tl=trendOf(p.L,p.n), tr=trendOf(p.R,p.n);
  o.trend=(o.weaker==0)?tl:tr;
  const char* wn=(o.weaker==0)?"Left":"Right"; const char* sn=(o.weaker==0)?"Right":"Left";
  bool dropL=(p.n>=4&&tl<-15), dropR=(p.n>=4&&tr<-15);
  char ts[80];
  if(dropL||dropR){
    const char* dn=dropL?"Left":"Right"; float dp=-(dropL?tl:tr);
    o.sev=3;
    snprintf(o.head,sizeof o.head,"%s hand dropped %.0f%% vs recent tests",dn,dp);
    snprintf(o.sub,sizeof o.sub,"Sudden decline | repeat test, see specialist");
    snprintf(ts,sizeof ts,"%s hand is down %.0f%% against the average of the last 3 tests.",dn,dp);
  } else if(o.asym>=25){
    o.sev=3;
    snprintf(o.head,sizeof o.head,"%s hand is %.0f%% weaker than %s",wn,o.asym,sn);
    if(o.trend>5) snprintf(o.sub,sizeof o.sub,"Significant gap | weaker hand improving +%.0f%%",o.trend);
    else          snprintf(o.sub,sizeof o.sub,"Significant gap | specialist review advised");
    snprintf(ts,sizeof ts,"Weaker hand (%s) trend: %+.0f%% vs the last 3 tests.",wn,o.trend);
  } else if(o.asym>=12){
    o.sev=2;
    snprintf(o.head,sizeof o.head,"Mild asymmetry: %s %.0f%% weaker",wn,o.asym);
    snprintf(o.sub,sizeof o.sub,"Retest in 2 days | trend %+.0f%%",o.trend);
    snprintf(ts,sizeof ts,"Weaker hand (%s) trend: %+.0f%% vs the last 3 tests.",wn,o.trend);
  } else if(l<s->lo && r<s->lo){
    o.sev=2;
    snprintf(o.head,sizeof o.head,"Both hands below target range");
    snprintf(o.sub,sizeof o.sub,"L %.1f / R %.1f kg | target %.0f-%.0f kg",l,r,s->lo,s->hi);
    snprintf(ts,sizeof ts,"Symmetry is good (gap %.0f%%) but both hands sit under the target.",o.asym);
  } else if(o.trend>8){
    o.sev=1;
    snprintf(o.head,sizeof o.head,"Recovery on track");
    snprintf(o.sub,sizeof o.sub,"%s hand %+.0f%% in last 3 tests | gap %.0f%%",wn,o.trend,o.asym);
    snprintf(ts,sizeof ts,"Weaker hand (%s) trend: %+.0f%% vs the last 3 tests.",wn,o.trend);
  } else {
    o.sev=1;
    snprintf(o.head,sizeof o.head,"Balanced and stable");
    snprintf(o.sub,sizeof o.sub,"Gap %.0f%% | within target range",o.asym);
    snprintf(ts,sizeof ts,"Results are steady across the last tests.");
  }
  snprintf(o.body,sizeof o.body,"Latest: L %.1f kg, R %.1f kg (gap %.0f%%). %s Target %.0f-%.0f kg. Assessment aid, not a diagnosis.",l,r,o.asym,ts,s->lo,s->hi);
  if(o.sev==3){ snprintf(o.tip1,sizeof o.tip1,"Repeat the test, relaxed posture"); snprintf(o.tip2,sizeof o.tip2,"Share this report with your specialist"); }
  else if(o.sev==2){ snprintf(o.tip1,sizeof o.tip1,"Retest in 2 days, same posture"); snprintf(o.tip2,sizeof o.tip2,"Track weekly and review the trend"); }
  else { snprintf(o.tip1,sizeof o.tip1,"Keep your daily routine"); snprintf(o.tip2,sizeof o.tip2,"Next test is due tomorrow"); }
}

// ===========================================================================
//  ICONS (primitive drawn)
// ===========================================================================
static void icoHome(int x,int y,uint16_t c,uint16_t bg){ TRI(x-11,y,x,y-10,x+11,y,c); FR(x-8,y,16,10,c); FR(x-2,y+3,5,7,bg); }
static void icoChart(int x,int y,uint16_t c){ FR(x-10,y+1,5,9,c); FR(x-2,y-5,5,15,c); FR(x+6,y-10,5,20,c); }
static void icoClip(int x,int y,uint16_t c){ RO(x-8,y-9,16,20,3,c); FR(x-4,y-12,8,5,c); HL(x-5,y-2,10,c); HL(x-5,y+2,10,c); HL(x-5,y+6,6,c); }
static void icoUser(int x,int y,uint16_t c){ FC(x,y-4,5,c); RR(x-9,y+3,18,8,4,c); }
static void icoPlay(int x,int y,uint16_t c){ TRI(x-6,y-9,x-6,y+9,x+9,y,c); }
static void icoCompare(int x,int y,uint16_t c){ FR(x-10,y-1,8,11,c); FR(x+2,y-9,8,19,c); }
static void icoPeople(int x,int y,uint16_t c){ FC(x-5,y-4,4,c); FC(x+6,y-3,3,c); RR(x-11,y+2,12,8,3,c); RR(x+1,y+3,11,7,3,c); }
static void icoCheck(int x,int y,uint16_t c){ LN(x-6,y,x-2,y+5,c); LN(x-6,y+1,x-2,y+6,c); LN(x-2,y+5,x+7,y-5,c); LN(x-2,y+6,x+7,y-4,c); }
static void icoWarn(int x,int y,uint16_t c){ FR(x-1,y-8,3,9,c); FR(x-1,y+3,3,3,c); }
static void icoBack(int x,int y,uint16_t c){ LN(x+4,y-8,x-4,y,c); LN(x+5,y-8,x-3,y,c); LN(x-4,y,x+4,y+8,c); LN(x-3,y,x+5,y+8,c); }
static void icoChev(int x,int y,uint16_t c){ LN(x-3,y-6,x+3,y,c); LN(x+3,y,x-3,y+6,c); LN(x-2,y-6,x+4,y,c); LN(x+4,y,x-2,y+6,c); }
static void icoClose(int x,int y,uint16_t c){ LN(x-7,y-7,x+7,y+7,c); LN(x-6,y-7,x+8,y+7,c); LN(x+7,y-7,x-7,y+7,c); LN(x+8,y-7,x-6,y+7,c); }
static void icoBle(int x,int y,uint16_t c){ LN(x,y-8,x,y+8,c); LN(x,y-8,x+5,y-3,c); LN(x+5,y-3,x-5,y+4,c); LN(x-5,y-4,x+5,y+3,c); LN(x+5,y+3,x,y+8,c); }
static void icoWifi(int x,int y,bool on){
  uint16_t c=on?C_TXT:C_BAD;
  for(int i=0;i<4;i++) FR(x-8+i*5,y+6-(i*3+3),3,i*3+3,on?(i<3?c:c):mix(C_BAR,c,110));
  if(!on) LN(x-9,y-7,x+9,y+8,C_BAD);
}
static void icoBatt(int x,int y,int pct){
  uint16_t c=pct<=20?C_BAD:(pct<=40?C_WARN:C_OK);
  RO(x,y,24,12,3,C_SUB); FR(x+24,y+3,2,6,C_SUB);
  FR(x+2,y+2,(20*clampi(pct,0,100))/100,8,c);
}
static void icoPulse(int x,int y,uint16_t c){ LN(x-9,y,x-4,y,c); LN(x-4,y,x-2,y-8,c); LN(x-2,y-8,x+2,y+8,c); LN(x+2,y+8,x+4,y,c); LN(x+4,y,x+9,y,c); }
static void arrowDelta(int x,int y,float d,Al a){      // coloured triangle + value, y = centre
  if(fabsf(d)<0.05f){ DT("= 0.0",x,y,a,C_SUB,F2); return; }
  char b[16]; snprintf(b,sizeof b,"%.1f",fabsf(d));
  int w=TW(b,F2)+14; int x0=(a==AL_R)?x-w:x;
  uint16_t c=d>0?C_OK:C_BAD;
  if(d>0) TRI(x0,y+4,x0+10,y+4,x0+5,y-5,c); else TRI(x0,y-4,x0+10,y-4,x0+5,y+5,c);
  DT(b,x0+14,y,AL_L,c,F2);
}


// ===========================================================================
//  BLE Wi-Fi PROVISIONING  (same GATT protocol as the existing mobile app)
//   SCAN  write -> notify one JSON per network, then {"done":true,"count":N}
//   CREDS write {"ssid","password","epoch"(optional, phone time)}
//   STATUS notify: AWAITING_CREDENTIALS | SCANNING | SCAN_COMPLETE | CONNECTING |
//                  CONNECTED:<ip> | FAILED:<reason>
//   INFO   read   {"code","fw","claimed","battery"}   (new, optional for the app)
// ===========================================================================
static void bleSetStatus(const char* s){
  strlcpy(bleStatus,s,sizeof bleStatus); Serial.printf("[BLE] status %s\n",s);
  if(bleStatCh){ bleStatCh->setValue(s); bleStatCh->notify(); }
}
class BleSrvCb : public BLEServerCallbacks {
  void onConnect(BLEServer* s) override { bleClient=true; }
  void onDisconnect(BLEServer* s) override { bleClient=false; if(bleActive){ delay(300); s->getAdvertising()->start(); } }
};
class BleScanCb : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic* c) override { bleScanReq=true; }           // scan runs in the net task
};
class BleCredsCb : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic* c) override {
    String v=c->getValue(); if(v.length()==0) return;
    StaticJsonDocument<320> d;
    if(deserializeJson(d,v)){ bleSetStatus("FAILED:BAD_JSON"); return; }
    const char* ss=d["ssid"]|""; if(!ss[0]){ bleSetStatus("FAILED:NO_SSID"); return; }
    strlcpy(blePendSsid,ss,sizeof blePendSsid); strlcpy(blePendPass,d["password"]|"",sizeof blePendPass);
    uint32_t ep=d["epoch"]|0; if(ep>1735689600UL) timeSetEpoch(ep,false);      // phone gives us the time
    bleCredsRx=true;
  }
};
static void bleStart(){
  if(bleStarted) return;
  snprintf(bleName,sizeof bleName,"PalmPressure-%04X",(unsigned)(ESP.getEfuseMac()&0xFFFF));
  BLEDevice::init(bleName); bleStarted=true;
  bleServer=BLEDevice::createServer(); bleServer->setCallbacks(new BleSrvCb());
  BLEService* svc=bleServer->createService(BLE_SERVICE_UUID);
  bleScanCh=svc->createCharacteristic(BLE_WIFI_SCAN_UUID,BLECharacteristic::PROPERTY_READ|BLECharacteristic::PROPERTY_NOTIFY|BLECharacteristic::PROPERTY_WRITE);
  bleScanCh->addDescriptor(new BLE2902()); bleScanCh->setCallbacks(new BleScanCb());
  bleCredsCh=svc->createCharacteristic(BLE_WIFI_CREDS_UUID,BLECharacteristic::PROPERTY_WRITE); bleCredsCh->setCallbacks(new BleCredsCb());
  bleStatCh=svc->createCharacteristic(BLE_WIFI_STATUS_UUID,BLECharacteristic::PROPERTY_READ|BLECharacteristic::PROPERTY_NOTIFY);
  bleStatCh->addDescriptor(new BLE2902());
  bleInfoCh=svc->createCharacteristic(BLE_DEV_INFO_UUID,BLECharacteristic::PROPERTY_READ);
  char info[160]; snprintf(info,sizeof info,"{\"code\":\"%s\",\"fw\":\"%s\",\"claimed\":%s,\"battery\":%d}",devCode,FW_VERSION,claimed?"true":"false",batPct);
  bleInfoCh->setValue(info);
  svc->start();
  BLEAdvertising* adv=BLEDevice::getAdvertising(); adv->addServiceUUID(BLE_SERVICE_UUID); adv->setScanResponse(true); adv->setMinPreferred(0x06);
  BLEDevice::startAdvertising();
  bleDone=false; bleActive=true; netState=NS_BLE; bleSetStatus("AWAITING_CREDENTIALS");
}
static void bleStop(){ if(!bleStarted) return; bleActive=false; BLEDevice::deinit(true); bleStarted=false; }

static bool wifiConnect(const char* ssid,const char* pass,uint32_t ms){
  WiFi.persistent(false); WiFi.mode(WIFI_STA); WiFi.setAutoReconnect(true);
  Serial.printf("[WIFI] Connecting to '%s' (timeout %d ms)...\n",ssid,ms);
  if(pass&&pass[0]) WiFi.begin(ssid,pass); else WiFi.begin(ssid);
  uint32_t t=millis(); 
  while(WiFi.status()!=WL_CONNECTED&&millis()-t<ms){
    Serial.printf("[WIFI] Status: %d (%d/%d ms)\n",WiFi.status(),millis()-t,ms);
    vTaskDelay(100/portTICK_PERIOD_MS);
  }
  bool connected=(WiFi.status()==WL_CONNECTED);
  if(connected) Serial.printf("[WIFI] Connected! IP: %s\n",WiFi.localIP().toString().c_str());
  else Serial.printf("[WIFI] Failed to connect (final status: %d)\n",WiFi.status());
  return connected;
}
static void bleSendScan(){
  bleSetStatus("SCANNING"); WiFi.mode(WIFI_STA); int n=WiFi.scanNetworks();
  for(int i=0;i<n;i++){
    StaticJsonDocument<192> d; d["ssid"]=WiFi.SSID(i); d["rssi"]=WiFi.RSSI(i); d["secure"]=(WiFi.encryptionType(i)!=WIFI_AUTH_OPEN);
    char out[192]; serializeJson(d,out,sizeof out);
    if(bleScanCh){ bleScanCh->setValue(out); bleScanCh->notify(); }
    vTaskDelay(30/portTICK_PERIOD_MS);
  }
  StaticJsonDocument<64> dd; dd["done"]=true; dd["count"]=n; char o2[64]; serializeJson(dd,o2,sizeof o2);
  if(bleScanCh){ bleScanCh->setValue(o2); bleScanCh->notify(); }
  WiFi.scanDelete(); bleSetStatus("SCAN_COMPLETE");
}
static void bleProvisionStep(){                      // runs in the net task while BLE is active
  if(bleScanReq){ bleScanReq=false; bleSendScan(); }
  if(bleCredsRx){
    bleCredsRx=false; bleSetStatus("CONNECTING");
    if(wifiConnect(blePendSsid,blePendPass,15000)){
      wifiCredsSave(blePendSsid,blePendPass);
      char b[64]; snprintf(b,sizeof b,"CONNECTED:%s",WiFi.localIP().toString().c_str()); bleSetStatus(b);
      vTaskDelay(2100/portTICK_PERIOD_MS); bleDone=true;
    } else { WiFi.disconnect(false,true); bleSetStatus("FAILED:CONNECT_TIMEOUT"); }
  }
}

// ===========================================================================
//  CLOUD  (Supabase Edge Function  device-sync  :  one request does everything)
//   request : battery/status + up to 6 pending measurements
//   response: claimed?, owner, target range, assessment queue, history, accepted ids
//   auth    : headers  apikey (publishable) + x-device-code + x-device-secret
// ===========================================================================
static int cloudPost(const String& body,String& resp){
  // Verify we have credentials
  if(!devCode[0] || !devSecret[0]) {
    Serial.printf("[CLOUD] ERROR: Missing credentials (code=%s, secret=%s)\n", devCode[0]?"OK":"EMPTY", devSecret[0]?"OK":"EMPTY");
    return -99;
  }
  
  Serial.printf("[CLOUD] Attempting connection to Supabase...\n");
  Serial.printf("[CLOUD] Host: %s\n", SUPABASE_HOST);
  Serial.printf("[CLOUD] Path: %s\n", FN_SYNC_PATH);
  
  // Use HTTPS directly (Supabase only supports HTTPS)
  WiFiClientSecure secureClient;
  secureClient.setInsecure();  // Skip cert verification for dev
  secureClient.setTimeout(20000);
  
  HTTPClient http;
  http.setTimeout(20000);
  
  // Build HTTPS URL
  String httpsUrl = String("https://") + SUPABASE_HOST + FN_SYNC_PATH;
  Serial.printf("[CLOUD] URL: %s\n", httpsUrl.c_str());
  
  Serial.printf("[CLOUD] Calling http.begin()...\n");
  if(!http.begin(secureClient, httpsUrl)) {
    Serial.printf("[CLOUD] ERROR: http.begin() failed\n");
    return -100;
  }
  
  Serial.printf("[CLOUD] http.begin() success, setting headers...\n");
  
  // Add headers
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_PUB_KEY);
  http.addHeader("x-device-code", devCode);
  http.addHeader("x-device-secret", devSecret);
  
  Serial.printf("[CLOUD] Headers set, body size: %d bytes\n", body.length());
  Serial.printf("[CLOUD] Sending POST request...\n");
  
  // Send request
  int code = http.POST(body);
  
  Serial.printf("[CLOUD] POST returned code: %d\n", code);
  
  if(code > 0) {
    resp = http.getString();
    Serial.printf("[CLOUD] Success! Response length: %d bytes\n", resp.length());
    if(resp.length() > 0 && resp.length() < 500) {
      Serial.printf("[CLOUD] Response: %s\n", resp.c_str());
    }
  } else {
    String errStr = http.errorToString(code);
    Serial.printf("[CLOUD] ERROR: %s (code: %d)\n", errStr.c_str(), code);
    Serial.printf("[CLOUD] RSSI: %d dBm, Free Heap: %u bytes\n", WiFi.RSSI(), ESP.getFreeHeap());
  }
  
  http.end();
  return code;
}
static void extractCid(const String& s,char* out,size_t n){
  out[0]=0; int i=s.indexOf("\"client_id\":\""); if(i<0) return; i+=13; int j=s.indexOf('"',i); if(j<0) return;
  strlcpy(out,s.substring(i,j).c_str(),n);
}
static int doSync(){
  char paths[6][48]; char cids[6][48]; int np=0;
  if(sdOk){
    sdLock(); File d=SD.open("/vs/pending");
    if(d){ File f=d.openNextFile();
      while(f&&np<6){ String nm=f.name(); if(nm.endsWith(".json")){ if(nm.startsWith("/")) strlcpy(paths[np],nm.c_str(),48); else snprintf(paths[np],48,"/vs/pending/%s",nm.c_str()); np++; } f.close(); f=d.openNextFile(); }
      if(f) f.close(); d.close(); }
    sdUnlock();
  }
  String body; body.reserve(3200); char hdr[460];
  snprintf(hdr,sizeof hdr,"{\"action\":\"%s\",\"pair_pin\":\"%s\",\"fw\":\"%s\",\"hw\":\"%s\",\"battery_pct\":%d,\"battery_v\":%.2f,\"charging\":%s,\"rssi\":%d,\"device_time\":%lu,\"time_valid\":%s,\"uptime_ms\":%lu,\"boot_id\":\"%s\",\"pending\":%d,\"measurements\":[",
    reqUnpair?"unpair":"sync",claimed?"":pairPin,FW_VERSION,HW_NAME,batPct,batPackV,batChg?"true":"false",(int)WiFi.RSSI(),(unsigned long)nowEpoch(),(nowEpoch()&&!timeEst)?"true":"false",(unsigned long)millis(),bootId,(int)pendingCnt);
  body=hdr; int used=0;
  for(int i=0;i<np;i++){
    String s; sdLock(); File f=SD.open(paths[i]); if(f){ s=f.readString(); f.close(); } sdUnlock();
    if(s.length()<10) { cids[i][0]=0; continue; }
    if(used) body+=","; body+=s; extractCid(s,cids[i],48); used++;
  }
  body+="]}";
  String resp; int code=cloudPost(body,resp);
  Serial.printf("[CLOUD] sync -> HTTP %d (sent %d records)\n",code,used);
  if(code==401||code==403){ authFail=true; cloudOk=false; return code; }
  if(code!=200){ cloudOk=false; return code; }
  authFail=false;
  StaticJsonDocument<5120> doc;
  if(deserializeJson(doc,resp)){ Serial.println("[CLOUD] bad JSON"); cloudOk=false; return -200; }
  if(!(doc["ok"]|false)){ cloudOk=false; return -201; }
  cloudOk=true;
  uint32_t st=doc["server_time"]|0;
  if(st>1735689600UL){ uint32_t dev=nowEpoch(); if(!dev||timeEst||(dev>st?dev-st:st-dev)>3) timeSetEpoch(st,false); }
  lastSyncEpoch=nowEpoch();
  // delete accepted + permanently rejected records
  for(JsonVariantConst a:doc["accepted"].as<JsonArrayConst>()){
    const char* id=a|""; for(int i=0;i<np;i++) if(cids[i][0]&&strcmp(cids[i],id)==0){ sdLock(); SD.remove(paths[i]); sdUnlock(); }
  }
  for(JsonObjectConst r:doc["rejected"].as<JsonArrayConst>()){
    const char* id=r["client_id"]|""; Serial.printf("[CLOUD] rejected %s: %s\n",id,(const char*)(r["reason"]|"?"));
    for(int i=0;i<np;i++) if(cids[i][0]&&strcmp(cids[i],id)==0){ sdLock(); SD.remove(paths[i]); sdUnlock(); }
  }
  pendingCnt=pendingCount();
  bool cl=doc["claimed"]|false;
  if(reqUnpair){ reqUnpair=false; }
  if(cl!=claimed){ claimed=cl; evClaim=true; }
  if(cl){
    const char* did=doc["device_id"]|""; if(did[0]) identitySaveDevId(did);
    profIn=PROF; strlcpy(profIn.name,doc["owner"]["name"]|(const char*)PROF.name,sizeof profIn.name);
    strlcpy(profIn.pid,doc["owner"]["patient_code"]|(const char*)PROF.pid,sizeof profIn.pid);
    strlcpy(profIn.spec,doc["specialist"]["name"]|(const char*)PROF.spec,sizeof profIn.spec);
    profIn.lo=doc["target"]["lo"]|PROF.lo; profIn.hi=doc["target"]["hi"]|PROF.hi; profInValid=true; evProfile=true;
    if(!doc["queue"].isNull()){ uint8_t n=0; queueParse(doc["queue"].as<JsonArrayConst>(),qIn,&n); qInN=n; evQueue=true; }
    if(!doc["history"].isNull()){
      JsonArrayConst h=doc["history"].as<JsonArrayConst>(); histIn.n=0;
      for(JsonObjectConst it:h){ if(histIn.n>=MAXS) break; histIn.ts[histIn.n]=it["t"]|0; histIn.L[histIn.n]=it["l"]|0.0f; histIn.R[histIn.n]=it["r"]|0.0f; histIn.n++; }
      evHistory=true;
    }
  } else evProfile=true;
  return code;
}
static void netTask(void*){
  uint32_t lastSync=0, nextTry=0; bool ntpAsked=false;
  for(;;){
    if(bleActive){ bleProvisionStep(); vTaskDelay(100/portTICK_PERIOD_MS); continue; }
    if(!identOk){ cloudOk=false; vTaskDelay(500/portTICK_PERIOD_MS); continue; }
    if(!haveCreds){ netState=NS_NO_CREDS; cloudOk=false; vTaskDelay(500/portTICK_PERIOD_MS); continue; }
    if(WiFi.status()!=WL_CONNECTED){
      cloudOk=false; ntpAsked=false;
      if(millis()<nextTry && !reqReconnect){ netState=NS_FAILED; vTaskDelay(250/portTICK_PERIOD_MS); continue; }
      reqReconnect=false; netState=NS_CONNECTING; WiFi.disconnect(false,false);
      Serial.printf("[WIFI] Attempting to connect to '%s'...\n",wifiSsid);
      if(!wifiConnect(wifiSsid,wifiPass,15000)){ 
        Serial.printf("[WIFI] Connection failed, retrying in 20 seconds\n");
        netState=NS_FAILED; nextTry=millis()+20000; 
        continue; 
      }
      Serial.println("[WIFI] Connection successful!");
      // Set DNS servers (use Google DNS as fallback)
      WiFi.dnsIP(0);  // Get default DNS
      WiFi.setDNS(IPAddress(8,8,8,8), IPAddress(8,8,4,4));  // Google DNS
      Serial.printf("[DNS] Set DNS to 8.8.8.8 / 8.8.4.4\n");
    }
    netState=NS_ONLINE;
    if(!ntpAsked&&(!timeValid()||timeEst)){ 
      Serial.println("[NTP] Syncing time with NTP servers...");
      configTime(0,0,"pool.ntp.org","time.google.com"); 
      ntpAsked=true; 
      vTaskDelay(2000/portTICK_PERIOD_MS);  // Give NTP time to sync
    }
    uint32_t now=millis();
    bool due=reqSync||reqUnpair||lastSync==0||(!claimed&&now-lastSync>4000)||(pendingCnt>0&&now-lastSync>15000)||(now-lastSync>180000);
    if(due){ reqSync=false; doSync(); lastSync=millis(); if(reqSync==false && pendingCnt>0 && cloudOk) lastSync=0; }
    vTaskDelay(200/portTICK_PERIOD_MS);
  }
}
static void titleBar(const char* title){
  G=&tft; BGR(0,26,480,32); icoBack(22,42,C_TXT); DT(title,42,42,AL_L,C_TXT,F12B); HL(0,58,480,C_LINE);
}
static void drawToast(){
  if(scr==S_TEST||scr==S_SPLASH||toastUntil==0) return;
  G=&tft; int w=TW(toastMsg,F9B)+36; int x=240-w/2, y=navVisible()?240:276;
  RR(x,y,w,28,14,C_CARD2); RO(x,y,w,28,14,toastCol); DT(toastMsg,240,y+14,AL_C,C_TXT,F9B);
}
static void toastC(const char* m,uint16_t c){
  strncpy(toastMsg,m,sizeof(toastMsg)-1); toastMsg[sizeof(toastMsg)-1]=0;
  toastCol=c; toastUntil=millis()+2200; drawToast();
}
static void toast(const char* m){ toastC(m,C_TEAL); }

// ===========================================================================
//  CHROME : status bar, modal, text fitting
// ===========================================================================
static void fitText(const char* s,int maxW,Fnt f,char* o,size_t n){
  strncpy(o,s,n-1); o[n-1]=0; G->setFont(f);
  if(G->textWidth(o)<=maxW) return;
  size_t l=strlen(o); char t[64];
  while(l>3){ l--; o[l]=0; snprintf(t,sizeof t,"%s..",o); if(G->textWidth(t)<=maxW){ snprintf(o,n,"%s",t); return; } }
}
static bool navVisible(){ return scr==S_HOME||scr==S_DASH||scr==S_ASSESS||scr==S_SETTINGS; }

static void drawStatus(){
  G=&tft; FR(0,0,480,26,C_BAR);
  FC(15,13,9,C_TEAL); icoPulse(15,13,C_INK);
  DT("VitalStep",30,13,AL_L,C_TXT,F9B);
  char b[40]; fitText(PROF.name[0]?PROF.name:"Not paired",120,F9,b,sizeof b);
  DT(b,108,13,AL_L,claimed?C_SUB:C_WARN,F9);
  fmtClock(b,sizeof b); DT(b,250,13,AL_L,timeEst?C_WARN:C_TXT,F9);
  if(pendingCnt>0){ snprintf(b,sizeof b,"%d queued",(int)pendingCnt); CHIP(296,6,b,C_WARN); }
  if(bleActive) icoBle(366,13,C_TEAL);
  icoWifi(388,13,netState==NS_ONLINE);
  uint16_t cc=cloudOk?C_OK:(authFail?C_BAD:C_DIM);                      // cloud icon
  FC(407,14,4,cc); FC(414,12,5,cc); FR(405,14,13,4,cc);
  int bp=(batPct<0)?100:batPct; icoBatt(426,7,bp);
  if(batPct<0) DT("USB",454,13,AL_L,C_SUB,F0);
  else { snprintf(b,sizeof b,"%d%%",batPct); DT(b,454,13,AL_L,(batPct<=BAT_LOW_PCT)?C_BAD:(batChg?C_OK:C_TXT),F0); }
  statusDirty=false;
}

static void drawModal(){
  G=&tft; RR(60,84,360,156,14,C_CARD2); RO(60,84,360,156,14,C_LINE);
  const char *t="",*m="",*b1="",*b2=""; uint16_t c2=C_TEAL;
  if(modal==M_NOSD){ t="SD card required"; m="Insert the SD card so results are stored safely, then restart the device."; b2="OK"; }
  else if(modal==M_UNPAIRED){ t="Device not paired"; m="Add this device in the app - or tap Skip to test standalone (data syncs to cloud)."; b1="Skip"; b2="Pair now"; }
  else if(modal==M_BATT_CRIT){ t="Battery too low"; m="Charge the device before starting a new test."; b2="OK"; c2=C_WARN; }
  else if(modal==M_EXIT_TEST){ t="Stop this test?"; m="Results for this assessment will not be saved."; b1="Continue"; b2="Stop"; c2=C_BAD; }
  else if(modal==M_RESET){ t="Reset device?"; m="Clears Wi-Fi, pairing cache and settings. SD card data is kept."; b1="Cancel"; b2="Reset"; c2=C_BAD; }
  else if(modal==M_BLE_EXIT){ t="Leave Wi-Fi setup?"; m="The device restarts to free memory, then reconnects."; b1="Stay"; b2="Restart"; c2=C_WARN; }
  else if(modal==M_RELEASE){ t="Unpair this device?"; m="It is released from the patient account and local data is cleared. Needs Wi-Fi."; b1="Cancel"; b2="Unpair"; c2=C_BAD; }
  DT(t,240,106,AL_C,C_TXT,F12B);
  WRAP(m,84,140,312,22,2,C_SUB,F9);
  if(b1[0]){ BTNO(80,190,150,38,b1,C_LINE,C_TXT); BTN(250,190,150,38,b2,c2,(c2==C_BAD)?C_WHITE:C_INK); }
  else BTN(150,190,180,38,b2,c2,C_INK);
}
static void goB(Scr s,Scr back);
static void go(Scr s);
static void testExit();
static void bleStart();
static void bleStop();
static void doFactoryReset(){
  prefs.begin("vs",false); uint32_t sq=prefs.getUInt("seq",0); prefs.clear(); prefs.putUInt("seq",sq); prefs.end();   // keep the id counter
  wifiCredsClear(); sdLock(); if(sdOk) SD.remove("/deviceID.txt"); sdUnlock();
  delay(200); ESP.restart();
}
static void modalOpen(Modal m){ modal=m; drawModal(); }
static void modalTap(){
  bool two=(modal==M_UNPAIRED||modal==M_EXIT_TEST||modal==M_RESET||modal==M_BLE_EXIT||modal==M_RELEASE);
  bool b1=two&&inR(tx,ty,80,190,150,38), b2=two?inR(tx,ty,250,190,150,38):inR(tx,ty,150,190,180,38);
  if(!b1&&!b2) return;
  Modal m=modal; modal=M_NONE;
  if(m==M_UNPAIRED&&b1){ go(S_HOME); return; }     // "Skip" - go to dashboard in test mode
  if(m==M_UNPAIRED&&b2){ goB(S_SETUP,S_HOME); return; }
  if(m==M_EXIT_TEST&&b2){ testExit(); return; }
  if(m==M_RESET&&b2){ doFactoryReset(); return; }
  if(m==M_BLE_EXIT&&b2){ bleStop(); delay(200); ESP.restart(); return; }
  if(m==M_RELEASE&&b2){ if(netState!=NS_ONLINE) toastC("Connect to Wi-Fi to unpair",C_WARN); else if(pendingCnt>0) toastC("Upload pending results first",C_WARN); else { reqUnpair=true; toast("Unpairing..."); } return; }
  needFull=true;
}

static void drawNav(int active){
  G=&tft; GRR(0,274,480,46,0,RGB(16,22,48),C_BAR); HL(0,274,480,C_LINE);
  static const char* lab[4]={"Home","Dashboard","Assess","Settings"};
  for(int i=0;i<4;i++){
    int cx=i*120+60; bool a=(i==active); uint16_t c=a?C_INK:C_DIM;
    if(a) GRRH(cx-24,277,48,25,12,C_G1,C_G2);
    if(i==0) icoHome(cx,289,c,a?C_G1:RGB(11,16,36)); else if(i==1) icoChart(cx,289,c); else if(i==2) icoClip(cx,289,c); else icoUser(cx,289,c);
    DT(lab[i],cx,309,AL_C,a?C_TXT:C_DIM,F9);
  }
}

// ===========================================================================
//  CHART (drawn straight to the panel; scrubbing repaints only a clipped strip)
// ===========================================================================
static void drawChart(const Patient& p,int ox,int oy,int w,int h,int range,int cursor,bool compact){
  int bx=ox, by=oy; lgfx::LGFXBase* prev=G; G=&tft;
  RR(bx,by,w,h,14,C_CARD);
  int n=p.n; int cnt=(range==0)?5:((range==1)?10:MAXS); if(cnt>n) cnt=n; int st=n-cnt;
  if(cnt==0){
    DT("No tests yet",bx+w/2,by+h/2-8,AL_C,C_SUB,F12B);
    DT("Take a test to start the trend",bx+w/2,by+h/2+16,AL_C,C_DIM,F9);
    chCnt=0; G=prev; return;
  }
  int pl=bx+(compact?28:38), pr=bx+w-14, pt=by+(compact?10:32), pb=by+h-(compact?20:24);
  chPl=ox+(pl-bx); chPr=ox+(pr-bx); chPt=oy+(pt-by); chPb=oy+(pb-by); chSt=st; chCnt=cnt;
  float mx=p.s->hi; for(int i=st;i<n;i++) mx=fmaxf(mx,fmaxf(p.L[i],p.R[i]));
  float ymax=ceilf(mx*1.08f/5.0f)*5.0f; if(ymax<10) ymax=10;
  uint16_t gridc=mix(C_CARD,C_LINE,170); char b[24];
  for(int g=0;g<=(int)ymax;g+=5){
    checkYield();  // ← FIX: Allow touch ISR every 10ms
    int yy=pb-(int)((pb-pt)*(float)g/ymax); HL(pl,yy,pr-pl,gridc);
    snprintf(b,sizeof b,"%d",g); DT(b,pl-6,yy,AL_R,C_DIM,F2);
  }
  int yH=pb-(int)((pb-pt)*p.s->hi/ymax), yL=pb-(int)((pb-pt)*p.s->lo/ymax);
  FR(pl,yH,pr-pl,yL-yH,mix(C_CARD,C_OK,36));
  if(!compact){
    FC(bx+46,by+14,4,C_L); DT("Left",bx+55,by+14,AL_L,C_SUB,F9);
    FC(bx+110,by+14,4,C_R); DT("Right",bx+119,by+14,AL_L,C_SUB,F9);
    FR(bx+186,by+10,12,8,mix(C_CARD,C_OK,90)); DT("Target range",bx+204,by+14,AL_L,C_SUB,F9);
  }
  for(int s2=0;s2<2;s2++){
    const float* a=(s2==0)?p.L:p.R; uint16_t c=(s2==0)?C_L:C_R; int lx=-1,ly=0;
    for(int i=0;i<cnt;i++){
      checkYield();  // ← FIX: Allow touch ISR every 10ms
      float v=a[st+i]; int xx=(cnt==1)?(pl+pr)/2:pl+8+((pr-pl-16)*i)/(cnt-1);
      if(v<=0){ lx=-1; continue; }
      int yy=pb-(int)((pb-pt)*v/ymax);
      if(lx>=0){ LN(lx,ly,xx,yy,c); LN(lx,ly+1,xx,yy+1,c); }
      lx=xx; ly=yy;
    }
    for(int i=0;i<cnt;i++){
      checkYield();  // ← FIX: Allow touch ISR every 10ms
      float v=a[st+i]; if(v<=0) continue;
      int xx=(cnt==1)?(pl+pr)/2:pl+8+((pr-pl-16)*i)/(cnt-1); int yy=pb-(int)((pb-pt)*v/ymax);
      FC(xx,yy,(i==cnt-1)?5:3,c); if(i==cnt-1) OC(xx,yy,7,mix(C_CARD,c,120));
    }
  }
  char d1[16]; fmtTs(p.ts[st],d1,sizeof d1); checkYield(); DT(d1,pl+2,pb+12,AL_L,C_DIM,F2);
  fmtTs(p.ts[n-1],d1,sizeof d1); checkYield(); DT(d1,pr-2,pb+12,AL_R,C_DIM,F2);
  if(!compact && cnt>=5){ fmtTs(p.ts[st+cnt/2],d1,sizeof d1); checkYield(); DT(d1,(pl+pr)/2,pb+12,AL_C,C_DIM,F2); }
  if(cursor>=0 && cursor<cnt){
    int i=cursor; int xx=(cnt==1)?(pl+pr)/2:pl+8+((pr-pl-16)*i)/(cnt-1);
    VL(xx,pt,pb-pt,C_SUB);
    int bw=124, bxx=clampi(xx-bw/2,pl,pr-bw), byy=pt+2;
    RR(bxx,byy,bw,38,8,C_CARD2); RO(bxx,byy,bw,38,8,C_LINE);
    fmtTs(p.ts[st+i],d1,sizeof d1); DT(d1,bxx+8,byy+10,AL_L,C_TXT,F2);
    snprintf(b,sizeof b,"L %.1f",p.L[st+i]); DT(b,bxx+8,byy+28,AL_L,C_L,F2);
    snprintf(b,sizeof b,"R %.1f",p.R[st+i]); DT(b,bxx+bw-8,byy+28,AL_R,C_R,F2);
  }
  G=prev;
}
static void firstName(const char* f,char* o,size_t n){ size_t i=0; while(f[i]&&f[i]!=' '&&i<n-1){ o[i]=f[i]; i++; } o[i]=0; }
static void kpi(int x,int y,int w,int h,const char* lab,const char* val,uint16_t col){
  RR(x,y,w,h,14,C_CARD); DT(lab,x+12,y+12,AL_L,C_SUB,F9); DT(val,x+12,y+31,AL_L,col,F12B);
}

// ===========================================================================
//  SETUP / PAIRING SCREEN  (device code QR + real Wi-Fi / cloud / pairing status)
// ===========================================================================
static void setupRow(int i,int st,const char* txt,uint16_t tc){      // st 0 pending, 1 active, 2 done, 3 fail
  int y=90+i*32; G=&tft; BGR(190,y-15,284,30);
  if(st==2){ FC(206,y,10,C_OK); icoCheck(206,y-1,C_INK); }
  else if(st==3){ FC(206,y,10,C_BAD); icoClose(206,y,C_WHITE); }
  else if(st==1){ OC(206,y,10,C_TEAL); OC(206,y,9,C_TEAL); float a=((millis()/110)%12)*30.0f*0.0174533f; FC(206+(int)(8*sinf(a)),y-(int)(8*cosf(a)),3,C_TEAL); }
  else OC(206,y,10,C_LINE);
  char f[44]; fitText(txt,236,F9,f,sizeof f); DT(f,228,y,AL_L,tc,F9);
}
static void drawSetupSteps(){
  char b[64];
  if(identOk&&sdOk) setupRow(0,2,"Storage and device identity OK",C_TXT);
  else if(!identOk) setupRow(0,3,"No device code on the SD card",C_BAD);
  else setupRow(0,3,"SD card missing",C_WARN);
  if(netState==NS_ONLINE){ snprintf(b,sizeof b,"Wi-Fi: %s",wifiSsid); setupRow(1,2,b,C_TXT); }
  else if(netState==NS_CONNECTING){ snprintf(b,sizeof b,"Connecting to %s",wifiSsid); setupRow(1,1,b,C_TEAL); }
  else if(netState==NS_BLE) setupRow(1,1,bleClient?"App connected over Bluetooth":"Waiting for the app (Bluetooth)",C_TEAL);
  else if(netState==NS_FAILED){ snprintf(b,sizeof b,"Cannot reach %s",wifiSsid); setupRow(1,3,b,C_BAD); }
  else setupRow(1,0,"Wi-Fi not set",C_DIM);
  if(cloudOk) setupRow(2,2,"Cloud connected",C_TXT);
  else if(authFail) setupRow(2,3,"Cloud rejected this device",C_BAD);
  else setupRow(2,(netState==NS_ONLINE)?1:0,"Reaching the cloud",(netState==NS_ONLINE)?C_TEAL:C_DIM);
  if(claimed){ snprintf(b,sizeof b,"Paired to %s",PROF.name[0]?PROF.name:"your account"); setupRow(3,2,b,C_OK); }
  else setupRow(3,cloudOk?1:0,"Add this device in the app",cloudOk?C_TEAL:C_DIM);
  BGR(190,214,284,36);
  if(bleActive){ DT(bleName,190,224,AL_L,C_TEAL,F9B); DT(bleStatus[0]?bleStatus:"READY",190,242,AL_L,C_SUB,F2); }
  else if(!haveCreds) DT("Tap Wi-Fi setup, then use the app",190,230,AL_L,C_DIM,F2);
}
static void drawSetupButtons(){
  G=&tft; BGR(186,254,290,60);
  if(bleActive) BTNO(190,262,136,42,"Stop setup",C_WARN,C_WARN); else BTN(190,262,136,42,"Wi-Fi setup",C_TEAL,C_INK);
  // Highlight Skip button in TEAL when cloud is reachable - user can go straight to dashboard
  if(cloudOk && !claimed){
    BTN(334,262,136,42,"Skip->Home",C_TEAL,C_INK);
  } else {
    BTNO(334,262,136,42,claimed?"Continue":"Skip",C_LINE,C_TXT);
  }
}
static void drawSetup(){
  G=&tft; titleBar("Set up VitalStep");
  RR(10,64,172,246,16,C_CARD); RR(18,72,156,156,8,C_WHITE);
  char q[96]; if(!claimed&&pairPin[0]) snprintf(q,sizeof q,"vitalstep://pair?code=%s&pin=%s",devCode,pairPin); else snprintf(q,sizeof q,"vitalstep://pair?code=%s",devCode);
  G->qrcode(q,22,76,148,3);
  DT(devCode[0]?devCode:"NO CODE",96,244,AL_C,C_TXT,F9B);
  if(!claimed&&pairPin[0]){ char pp[16]; snprintf(pp,sizeof pp,"PIN %c%c%c %c%c%c",pairPin[0],pairPin[1],pairPin[2],pairPin[3],pairPin[4],pairPin[5]); DT(pp,96,266,AL_C,C_TEAL,F9B); }
  DT("Scan in the app, or",96,284,AL_C,C_DIM,F2); DT("enter code + PIN",96,300,AL_C,C_DIM,F2);
  drawSetupSteps(); drawSetupButtons();
}
static uint32_t claimShownT=0;
static void setupTick(uint32_t now){
  static uint32_t la=0; if(now-la>200){ la=now; drawSetupSteps(); static bool lb=false; if(lb!=bleActive){ lb=bleActive; drawSetupButtons(); } }
  if(bleDone){ bleDone=false; toast("Wi-Fi saved - restarting"); delay(900); bleStop(); delay(200); ESP.restart(); }
  if(claimed&&!claimShownT){ claimShownT=now; }
  if(claimed&&claimShownT&&now-claimShownT>2500&&!bleActive){ claimShownT=0; go(S_HOME); }
  if(!claimed) claimShownT=0;
}
static void tapSetup(){
  if(inR(tx,ty,0,26,100,32)){ if(bleActive) modalOpen(M_BLE_EXIT); else go(S_HOME); return; }
  if(inR(tx,ty,190,262,136,42)){ if(bleActive) modalOpen(M_BLE_EXIT); else if(identOk){ bleStart(); drawSetupSteps(); drawSetupButtons(); statusDirty=true; } return; }
  if(inR(tx,ty,334,262,136,42)){ if(bleActive) modalOpen(M_BLE_EXIT); else go(S_HOME); }
}

// ===========================================================================
//  HOME
// ===========================================================================
static void lastTestStr(const Patient& p,char* o,size_t n){
  if(p.n==0){ snprintf(o,n,"no tests yet"); return; }
  uint32_t t=p.ts[p.n-1], e=nowEpoch(); if(!t||!e){ snprintf(o,n,"recorded"); return; }
  long d=dayNumber(e)-dayNumber(t); if(d<=0) snprintf(o,n,"today"); else if(d==1) snprintf(o,n,"yesterday"); else snprintf(o,n,"%ld days ago",d);
}
static void drawHome(){
  G=&tft; const Patient& p=pts[cur]; char b[64], fn[24], ls[24];
  if(PROF.name[0]) firstName(PROF.name,fn,sizeof fn); else snprintf(fn,sizeof fn,"there");
  uint32_t e=nowEpoch(); int hh=9; if(e){ struct tm t; localTm(e,&t); hh=t.tm_hour; }
  snprintf(b,sizeof b,"Good %s, %s",hh<12?"morning":(hh<17?"afternoon":"evening"),fn);
  DT(b,14,44,AL_L,C_TXT,F12B);
  lastTestStr(p,ls,sizeof ls); snprintf(b,sizeof b,"Last test: %s",ls); DT(b,468,44,AL_R,C_SUB,F9);
  Insight in; computeInsight(p,in); uint16_t sc=sevColor(in.sev);
  // hero card with two activity-style rings
  GRR(10,64,460,124,18,C_HERO1,C_HERO2);
  float l=p.n?p.L[p.n-1]:0, r=p.n?p.R[p.n-1]:0, hi=PROF.hi*1.15f;
  uint16_t trk=mix(C_HERO2,C_WHITE,46);
  ringGauge(100,118,39,51,l/hi,C_L,C_L2,trk); ringGauge(380,118,39,51,r/hi,C_R,C_R2,trk);
  if(l>0){ snprintf(b,sizeof b,"%.1f",l); DT(b,100,113,AL_C,C_WHITE,F12B); } else DT("--",100,113,AL_C,C_SUB,F12B);
  if(r>0){ snprintf(b,sizeof b,"%.1f",r); DT(b,380,113,AL_C,C_WHITE,F12B); } else DT("--",380,113,AL_C,C_SUB,F12B);
  DT("kg",100,135,AL_C,RGB(190,200,255),F2); DT("kg",380,135,AL_C,RGB(190,200,255),F2);
  DT("LEFT HAND",100,179,AL_C,C_L,F9B); DT("RIGHT HAND",380,179,AL_C,C_R,F9B);
  DT("SYMMETRY",240,84,AL_C,RGB(190,200,255),F2);
  bool both=(l>0&&r>0);
  if(both){ snprintf(b,sizeof b,"%.0f%%",in.asym); DT(b,240,118,AL_C,C_WHITE,F24B); } else DT("--",240,118,AL_C,C_WHITE,F24B);
  DT(both?(in.sev>=3?"Significant gap":(in.sev==2?"Mild gap":"Balanced")):"Test both hands",240,152,AL_C,both?sc:C_SUB,F9B);
  if(both&&p.n>=2){ snprintf(b,sizeof b,"%s hand %+.0f%%",in.weaker?"Right":"Left",in.trend); DT(b,240,172,AL_C,RGB(190,200,255),F2); }
  // insight row
  RR(10,194,460,34,14,C_CARD); FC(30,211,6,sc); char f[60]; fitText(in.head,380,F9B,f,sizeof f); DT(f,46,211,AL_L,C_TXT,F9B); icoChev(454,211,C_DIM);
  // actions
  BTN(10,234,228,36,"Take Test",C_TEAL,C_INK); icoPlay(66,252,C_INK);
  BTNO(246,234,108,36,"Analysis",C_LINE,C_TXT); BTNO(362,234,108,36,"Sync",C_LINE,C_TXT);
  if(pendingCnt>0){ FC(458,238,9,C_WARN); snprintf(b,sizeof b,"%d",(int)pendingCnt); DT(b,458,238,AL_C,C_INK,F2); }
}
static void testFromUI(uint8_t hand,uint8_t posture,int32_t aid);
static void startNextTest(){
  for(int i=0;i<queueN;i++) if(!queueItems[i].done){ testFromUI(queueItems[i].hand,queueItems[i].posture,queueItems[i].id); return; }
  testFromUI((uint8_t)weakerHand(pts[cur]),0,0);
}
static void doSyncNow(){
  if(netState==NS_ONLINE){ reqSync=true; toast("Syncing..."); }
  else if(!haveCreds) toastC("Wi-Fi not set - open Settings",C_WARN);
  else { reqReconnect=true; toastC("Offline - results are kept on SD",C_WARN); }
}
static void tapHome(){
  if(inR(tx,ty,10,194,460,34)){ goB(S_INSIGHT,S_HOME); return; }
  if(inR(tx,ty,160,64,160,124)){ goB(S_COMPARE,S_HOME); return; }
  if(inR(tx,ty,10,64,460,124)){ go(S_DASH); return; }
  if(inR(tx,ty,10,234,228,36)){ startNextTest(); return; }
  if(inR(tx,ty,246,234,108,36)){ go(S_DASH); return; }
  if(inR(tx,ty,362,234,108,36)) doSyncNow();
}

// ===========================================================================
//  DASHBOARD  (trends + session list)
// ===========================================================================
static int chX(int idx){ return (chCnt<=1)?(chPl+chPr)/2:chPl+8+((chPr-chPl-16)*idx)/(chCnt-1); }
static void chartClip(const Patient& p,int rx,int cursor){
  tft.setClipRect(rx,chPt-2,252,chPb-chPt+6); drawChart(p,10,112,460,158,dashRange,cursor,false); tft.clearClipRect(); G=&tft;
}
static void dashScrubTo(int ni){
  const Patient& p=pts[cur]; int oi=scrub; scrub=ni;
  if(oi>=0) chartClip(p,chX(oi)-126,ni);
  if(ni>=0&&ni!=oi) chartClip(p,chX(ni)-126,ni);
}
static void drawSessions(const Patient& p){
  G=&tft; RR(10,66,460,204,16,C_CARD);
  DT("DATE",24,80,AL_L,C_DIM,F2); DT("LEFT",196,80,AL_R,C_L,F2); DT("RIGHT",300,80,AL_R,C_R,F2); DT("GAP",440,80,AL_R,C_DIM,F2);
  HL(20,90,440,C_LINE);
  if(p.n==0){ DT("No sessions yet",240,170,AL_C,C_SUB,F12B); return; }
  char b[24];
  for(int i=0;i<7&&i<p.n;i++){
    int k=p.n-1-i, y=104+i*25; float l=p.L[k], r=p.R[k];
    fmtTs(p.ts[k],b,sizeof b); DT(b,24,y,AL_L,i==0?C_TXT:C_SUB,F9);
    snprintf(b,sizeof b,"%.1f",l); DT(l>0?b:"--",196,y,AL_R,C_L,F9B);
    snprintf(b,sizeof b,"%.1f",r); DT(r>0?b:"--",300,y,AL_R,C_R,F9B);
    float a=asymOf(l,r); snprintf(b,sizeof b,"%.0f%%",a); if(l>0&&r>0) DT(b,440,y,AL_R,a>=25?C_BAD:(a>=12?C_WARN:C_OK),F9B);
  }
}
static void drawDash(){
  G=&tft; const Patient& p=pts[cur];
  RR(10,34,224,26,13,C_CARD); GRRH(12+dashTab*110,36,108,22,11,C_G1,C_G2);
  DT("Trends",67,47,AL_C,dashTab==0?C_INK:C_SUB,F9B); DT("Sessions",177,47,AL_C,dashTab==1?C_INK:C_SUB,F9B);
  if(dashTab==1){ drawSessions(p); return; }
  DT("Last:",346,47,AL_R,C_SUB,F9);
  static const char* rl[3]={"5","10","All"};
  for(int i=0;i<3;i++){ int x=350+i*42; RR(x,35,36,24,12,dashRange==i?C_TEAL:C_CARD); DT(rl[i],x+18,47,AL_C,dashRange==i?C_INK:C_SUB,F9B); }
  char b[24]; float al=avgOf(p.L,p.n), ar=avgOf(p.R,p.n);
  snprintf(b,sizeof b,"%u",p.tests); kpi(10,66,109,42,"Total tests",b,C_TXT);
  snprintf(b,sizeof b,"%.1f kg",al); kpi(127,66,109,42,"Avg left",p.n?b:"--",C_L);
  snprintf(b,sizeof b,"%.1f kg",ar); kpi(244,66,109,42,"Avg right",p.n?b:"--",C_R);
  Insight in; computeInsight(p,in);
  snprintf(b,sizeof b,"%.0f%%",in.asym); kpi(361,66,109,42,"Asymmetry",(p.n&&p.L[p.n-1]>0&&p.R[p.n-1]>0)?b:"--",sevColor(in.sev));
  drawChart(p,10,112,460,158,dashRange,scrub,false); G=&tft;
}
static void tapDash(){
  if(inR(tx,ty,10,34,224,26)){ uint8_t t=(tx<122)?0:1; if(t!=dashTab){ dashTab=t; scrub=-1; needFull=true; } return; }
  if(dashTab==0&&ty>=34&&ty<60&&tx>=350){ int i=(tx-350)/42; if(i>=0&&i<3&&i!=dashRange){ dashRange=i; scrub=-1; needFull=true; } }
}
static void dashDrag(){
  if(dashTab!=0||chCnt<=0) return;
  if(!inR(tx,ty,chPl-6,chPt-4,chPr-chPl+12,chPb-chPt+8)) return;
  int i=(chCnt==1)?0:(int)(((float)(tx-chPl-8)/(float)(chPr-chPl-16))*(chCnt-1)+0.5f);
  i=clampi(i,0,chCnt-1); if(i!=scrub) dashScrubTo(i);
}

// ===========================================================================
//  ASSESSMENTS  (cloud queue cached on SD + quick test)
// ===========================================================================
static void assessCard(int y,const char* title,const char* sub,const char* tag,uint16_t tagc,bool hasStart){
  RR(10,y,460,62,16,C_CARD); FC(38,y+31,17,mix(C_CARD,tagc,70)); icoClip(38,y+31,tagc);
  DT(title,64,y+18,AL_L,C_TXT,F9B); CHIP(64+TW(title,F9B)+8,y+11,tag,tagc); DT(sub,64,y+43,AL_L,C_SUB,F9);
  if(hasStart) BTN(376,y+14,86,34,"Start",C_TEAL,C_INK);
}
static void drawAssess(){
  G=&tft; char b[64], d[16], sub[60];
  DT("Assessments",14,44,AL_L,C_TXT,F12B);
  if(nowEpoch()){ fmtTs(nowEpoch(),d,sizeof d); snprintf(b,sizeof b,"Today, %s",d); DT(b,468,44,AL_R,C_SUB,F9); }
  int y=62, shown=0;
  for(int i=0;i<queueN&&shown<2;i++){
    const QItem& q=queueItems[i]; snprintf(sub,sizeof sub,"%s hand | %s | 3 trials",q.hand?"Right":"Left",q.posture?"Standing":"Sitting");
    assessCard(y,q.title,sub,q.done?"DONE":"ASSIGNED",q.done?C_OK:C_WARN,!q.done); y+=68; shown++;
  }
  if(shown==0){ RR(10,y,460,62,16,C_CARD); DT("No assessment assigned",24,y+22,AL_L,C_TXT,F9B); DT(haveCreds?"Your specialist can assign one in the app":"Connect Wi-Fi to receive assignments",24,y+43,AL_L,C_SUB,F9); y+=68; }
  int wk=weakerHand(pts[cur]);
  snprintf(sub,sizeof sub,"%s hand | Sitting | not assigned",wk?"Right":"Left");
  assessCard(y,"Quick test",sub,"ANYTIME",C_TEAL,true);
  if(!cloudOk&&queueN>0) DT("Showing the last list saved on this device",240,262,AL_C,C_DIM,F2);
}
static void tapAssess(){
  int y=62, shown=0;
  for(int i=0;i<queueN&&shown<2;i++){ const QItem& q=queueItems[i];
    if(!q.done&&inR(tx,ty,376,y+14,86,34)){ testFromUI(q.hand,q.posture,q.id); return; }
    y+=68; shown++; }
  if(shown==0) y+=68;
  if(inR(tx,ty,376,y+14,86,34)) testFromUI((uint8_t)weakerHand(pts[cur]),0,0);
}

// ===========================================================================
//  SETTINGS  (status page + options page)
// ===========================================================================
static void kv(int x,int y,int w,const char* k,const char* v,uint16_t c){
  DT(k,x+12,y,AL_L,C_SUB,F9); char f[40]; fitText(v,w-100,F9B,f,sizeof f); DT(f,x+w-12,y,AL_R,c,F9B);
}
static void drawSettings(){
  G=&tft; char b[80];
  RR(10,34,224,26,13,C_CARD); GRRH(12+setPage*110,36,108,22,11,C_G1,C_G2);
  DT("Status",67,47,AL_C,setPage==0?C_INK:C_SUB,F9B); DT("Options",177,47,AL_C,setPage==1?C_INK:C_SUB,F9B);
  if(setPage==1){
    static const char* bl[4]={"Low","Med","High","Max"};
    RR(10,66,460,34,14,C_CARD); DT("Brightness",24,83,AL_L,C_TXT,F9B);
    for(int i=0;i<4;i++){ int x=240+i*58; if(optBright==i) GRRH(x,70,52,26,13,C_G1,C_G2); else RR(x,70,52,26,13,C_CARD2); DT(bl[i],x+26,83,AL_C,optBright==i?C_INK:C_SUB,F9B); }
    RR(10,104,460,34,14,C_CARD); DT("Sound",24,121,AL_L,C_TXT,F9B);
    RR(366,108,94,26,13,optSound?mix(C_CARD,C_OK,80):C_CARD2); DT(optSound?"On":"Off",413,121,AL_C,optSound?C_OK:C_SUB,F9B);
    RR(10,142,460,34,14,C_CARD); DT("Calibrate scale",24,159,AL_L,C_TXT,F9B); icoChev(456,159,C_DIM);
    RR(10,180,460,34,14,C_CARD); DT("Unpair device",24,197,AL_L,C_WARN,F9B); icoChev(456,197,C_DIM);
    RR(10,218,460,34,14,C_CARD); DT("Reset device",24,235,AL_L,C_BAD,F9B); icoChev(456,235,C_DIM);
    snprintf(b,sizeof b,"%s | fw %s | %s",HW_NAME,FW_VERSION,devCode[0]?devCode:"no code");
    DT(b,240,262,AL_C,C_DIM,F2); return;
  }
  RR(10,66,228,136,16,C_CARD); DT("CONNECTION",24,80,AL_L,C_DIM,F2);
  const char* ws; uint16_t wc;
  if(netState==NS_ONLINE){ snprintf(b,sizeof b,"%s",wifiSsid); ws=b; wc=C_OK; }
  else if(netState==NS_CONNECTING){ ws="Connecting..."; wc=C_WARN; }
  else if(netState==NS_BLE){ ws="Setup mode"; wc=C_TEAL; }
  else if(netState==NS_FAILED){ ws="Not connected"; wc=C_BAD; }
  else { ws="Not set"; wc=C_BAD; }
  kv(10,102,228,"Wi-Fi",ws,wc);
  kv(10,124,228,"Cloud",cloudOk?"Online":(authFail?"Rejected":"Offline"),cloudOk?C_OK:(authFail?C_BAD:C_WARN));
  kv(10,146,228,"Paired",claimed?(PROF.name[0]?PROF.name:"Yes"):"Not paired",claimed?C_OK:C_WARN);
  char pc[16]; snprintf(pc,sizeof pc,pendingCnt>0?"%d queued":"All synced",(int)pendingCnt);
  kv(10,168,228,"Uploads",pc,pendingCnt>0?C_WARN:C_OK);
  char ls[16]="never"; if(lastSyncEpoch){ struct tm t; localTm(lastSyncEpoch,&t); snprintf(ls,sizeof ls,"%02d:%02d",t.tm_hour,t.tm_min); }
  kv(10,190,228,"Last sync",ls,C_TXT);
  RR(246,66,224,136,16,C_CARD); DT("DEVICE",260,80,AL_L,C_DIM,F2);
  char bt[24]; if(batPct<0) snprintf(bt,sizeof bt,"USB power"); else snprintf(bt,sizeof bt,"%d%% %.1fV%s",batPct,batPackV,batChg?" +":"");
  kv(246,102,224,"Battery",bt,batPct<0?C_SUB:(batPct<=BAT_LOW_PCT?C_BAD:(batChg?C_OK:C_TXT)));
  kv(246,124,224,"SD card",sdOk?"OK":"Missing",sdOk?C_OK:C_BAD);
  kv(246,146,224,"Load cell",hxOk?"OK":"Not found",hxOk?C_OK:C_BAD);
  kv(246,168,224,"Code",devCode[0]?devCode:"--",C_TXT);
  kv(246,190,224,"Firmware",FW_VERSION,C_TXT);
  BTN(10,208,146,52,"Wi-Fi setup",C_TEAL,C_INK); BTNO(167,208,146,52,"Sync now",C_LINE,C_TXT); BTNO(324,208,146,52,"Zero scale",C_LINE,C_TXT);
}
static void tapSettings(){
  if(inR(tx,ty,10,34,224,26)){ uint8_t t=(tx<122)?0:1; if(t!=setPage){ setPage=t; needFull=true; } return; }
  if(setPage==1){
    for(int i=0;i<4;i++) if(inR(tx,ty,240+i*58,70,52,26)){ optBright=(uint8_t)i; optionsSave(); applyBrightness(); needFull=true; return; }
    if(inR(tx,ty,366,108,94,26)){ optSound=!optSound; optionsSave(); beepOk(); needFull=true; return; }
    if(inR(tx,ty,10,142,460,34)){ calStep=0; goB(S_CALIB,S_SETTINGS); return; }
    if(inR(tx,ty,10,180,460,34)){ if(!claimed) toastC("This device is not paired",C_WARN); else modalOpen(M_RELEASE); return; }
    if(inR(tx,ty,10,218,460,34)){ modalOpen(M_RESET); return; }
    return;
  }
  if(inR(tx,ty,10,208,146,52)){ if(!identOk){ toastC("No device code on SD",C_BAD); return; } goB(S_SETUP,S_SETTINGS); bleStart(); return; }
  if(inR(tx,ty,167,208,146,52)){ doSyncNow(); return; }
  if(inR(tx,ty,324,208,146,52)){ toast("Zeroing scale..."); hxZero(); toast(hxOk?"Scale zeroed":"Load cell not found"); }
}

// ===========================================================================
//  SCALE CALIBRATION  (zero, then a known weight)
// ===========================================================================
static void calReading(){
  float kg=0; static float last=0; if(hxPoll(&kg)) last=kg; char b[24]; snprintf(b,sizeof b,"%.2f kg",last);
  G=&tft; FR(250,150,210,44,C_CARD); DT(b,355,172,AL_C,C_TXT,F12B);
}
static void drawCalib(){
  G=&tft; titleBar("Calibrate scale"); char b[40];
  RR(10,64,460,200,16,C_CARD);
  if(calStep==0){
    DT("1. Remove everything from the dome",24,90,AL_L,C_TXT,F9B); DT("The scale will be set to zero.",24,114,AL_L,C_SUB,F9);
    BTN(24,196,200,48,"Zero now",C_TEAL,C_INK);
  } else if(calStep==1){
    DT("2. Place a known weight on the dome",24,90,AL_L,C_TXT,F9B); DT("Set the weight you are using:",24,114,AL_L,C_SUB,F9);
    BTNO(24,140,60,46,"-",C_LINE,C_TXT); snprintf(b,sizeof b,"%.1f kg",calKg); DT(b,154,163,AL_C,C_TXT,F12B); BTNO(224,140,60,46,"+",C_LINE,C_TXT);
    DT("Reading:",300,130,AL_L,C_SUB,F9); calReading();
    BTN(24,200,260,44,"Calibrate",C_TEAL,C_INK);
  } else {
    FC(60,120,22,C_OK); icoCheck(60,119,C_INK); DT("Scale calibrated and saved",96,112,AL_L,C_TXT,F12B);
    snprintf(b,sizeof b,"Factor %.1f",hxScaleF); DT(b,96,142,AL_L,C_SUB,F9); BTN(24,200,200,44,"Done",C_TEAL,C_INK);
  }
}
static void tapCalib(){
  if(inR(tx,ty,0,26,100,32)){ goB(S_SETTINGS,S_HOME); return; }
  if(calStep==0&&inR(tx,ty,24,196,200,48)){ toast("Zeroing..."); hxZero(); calStep=1; needFull=true; return; }
  if(calStep==1){
    if(inR(tx,ty,24,140,60,46)){ if(calKg>0.5f) calKg-=0.5f; needFull=true; return; }
    if(inR(tx,ty,224,140,60,46)){ calKg+=0.5f; needFull=true; return; }
    if(inR(tx,ty,24,200,260,44)){
      if(!hxOk){ toastC("Load cell not found",C_BAD); return; }
      long raw=scale.read_average(10); long off=scale.get_offset(); float f=(float)(raw-off)/(calKg*1000.0f);
      if(fabsf(f)<100.0f){ toastC("No weight detected - try again",C_BAD); return; }
      hxScaleF=f; scale.set_scale(f); prefs.begin("vs",false); prefs.putFloat("hxs",f); prefs.end(); calStep=2; needFull=true; return;
    }
  }
  if(calStep==2&&inR(tx,ty,24,200,200,44)) goB(S_SETTINGS,S_HOME);
}
static void drawInsight(){
  G=&tft; const Patient& p=pts[cur]; Insight in; computeInsight(p,in); uint16_t sc=sevColor(in.sev);
  titleBar("Health Insight");
  RR(10,64,460,248,16,C_CARD); RR(10,64,7,248,3,sc);
  checkYield();  // ← FIX: Allow touch ISR
  CHIP(30,72,sevName(in.sev),sc); if(PROF.spec[0]) DT(PROF.spec,462,79,AL_R,C_DIM,F2);
  WRAP(in.head,30,106,430,28,2,C_TXT,F12B);
  bool has=(p.n>0&&p.L[p.n-1]>0&&p.R[p.n-1]>0);
  char b[24]; snprintf(b,sizeof b,"Gap %.0f%%",in.asym); DT(has?b:"Gap --",30,168,AL_L,C_TXT,F9B);
  int bx=108,bw=348,by=162;
  checkYield();  // ← FIX: Allow touch ISR
  FR(bx,by,bw*12/50,12,mix(C_CARD,C_OK,200)); FR(bx+bw*12/50,by,bw*13/50,12,mix(C_CARD,C_WARN,200)); FR(bx+bw*25/50,by,bw-bw*25/50,12,mix(C_CARD,C_BAD,200));
  if(has){ int mx=bx+(int)(bw*clampf(in.asym/50.0f,0,1)); TRI(mx-6,by-8,mx+6,by-8,mx,by,C_WHITE); VL(mx,by,12,C_WHITE); }
  DT("0",bx,by+22,AL_L,C_DIM,F2); DT("12%",bx+bw*12/50,by+22,AL_C,C_DIM,F2); DT("25%",bx+bw/2,by+22,AL_C,C_DIM,F2); DT("50%",bx+bw,by+22,AL_R,C_DIM,F2);
  checkYield();  // ← FIX: Allow touch ISR
  WRAP(in.body,30,208,424,21,3,C_SUB,F9);
  FC(34,274,3,sc); DT(in.tip1,46,274,AL_L,C_TXT,F9);
  FC(34,294,3,sc); DT(in.tip2,46,294,AL_L,C_TXT,F9);
}
static void tapInsight(){}

static void drawCompare(){
  G=&tft; const Patient& p=pts[cur]; titleBar("Compare"); char b[64],d[16];
  RR(10,64,250,26,13,C_CARD); GRRH(12+cmpTab*124,66,122,22,11,C_G1,C_G2);
  DT("Left vs Right",73,77,AL_C,cmpTab==0?C_INK:C_SUB,F9B); DT("Now vs Previous",197,77,AL_C,cmpTab==1?C_INK:C_SUB,F9B);
  checkYield();  // ← FIX: Allow touch ISR
  if(p.n==0){ RR(10,98,460,214,16,C_CARD); DT("Nothing to compare yet",240,190,AL_C,C_SUB,F12B); DT("Take a test with each hand first",240,220,AL_C,C_DIM,F9); return; }
  Insight in; computeInsight(p,in);
  if(cmpTab==0){
    int cnt=imin(6,p.n), st=p.n-cnt; float mx=10; for(int i=st;i<p.n;i++) mx=fmaxf(mx,fmaxf(p.L[i],p.R[i]));
    float kp=150.0f/ceilf(mx); int cx=252;
    DT("LEFT",cx-6,104,AL_R,C_L,F2); DT("RIGHT",cx+6,104,AL_L,C_R,F2);
    checkYield();  // ← FIX: Allow touch ISR
    for(int i=0;i<cnt;i++){
      int ry=114+i*26, k=st+i; float l=p.L[k], r=p.R[k]; bool last=(k==p.n-1);
      if(last) RO(8,ry-1,464,26,6,C_TEAL);
      fmtTs(p.ts[k],d,sizeof d); DT(d,16,ry+12,AL_L,last?C_TXT:C_DIM,F2);
      int lw=(int)(l*kp), rw=(int)(r*kp);
      if(l>0){ RR(cx-2-lw,ry+3,lw,18,4,C_L); snprintf(b,sizeof b,"%.1f",l); if(lw>36) DT(b,cx-lw+4,ry+12,AL_L,C_INK,F2); else DT(b,cx-lw-4,ry+12,AL_R,C_L,F2); }
      if(r>0){ RR(cx+2,ry+3,rw,18,4,C_R); snprintf(b,sizeof b,"%.1f",r); if(rw>36) DT(b,cx+rw,ry+12,AL_R,C_INK,F2); else DT(b,cx+rw+6,ry+12,AL_L,C_R,F2); }
      checkYield();  // ← FIX: Allow touch ISR (every iteration)
      float a=asymOf(l,r); snprintf(b,sizeof b,"%.0f%%",a); uint16_t ac=a>=25?C_BAD:(a>=12?C_WARN:C_OK);
      if(l>0&&r>0) DT(b,466,ry+12,AL_R,ac,F9B);
    }
    VL(cx,110,6*26+4,C_LINE);
    RR(10,274,460,38,14,C_CARD);
    checkYield();  // ← FIX: Allow touch ISR
    if(in.asym>0){ snprintf(b,sizeof b,"Latest gap %.0f%% | %s hand weaker | trend %+.0f%%",in.asym,in.weaker==0?"Left":"Right",in.trend); DT(b,22,293,AL_L,sevColor(in.sev),F9B); }
    else DT("Test both hands to see the gap",22,293,AL_L,C_SUB,F9);
  } else {
    for(int h=0;h<2;h++){
      checkYield();  // ← FIX: Allow touch ISR (each hand loop)
      int x=10+h*236; const float* a=(h==0)?p.L:p.R; uint16_t c=(h==0)?C_L:C_R;
      RR(x,98,224,176,16,C_CARD); FC(x+16,114,5,c); DT(h==0?"LEFT HAND":"RIGHT HAND",x+28,114,AL_L,C_SUB,F9);
      float v0=a[0], vp=(p.n>1)?a[p.n-2]:a[0], vc=a[p.n-1]; float vals[3]={v0,vp,vc}; const char* nm[3]={"Baseline","Previous","Current"};
      float mx=fmaxf(fmaxf(v0,vp),fmaxf(vc,10)); float kp=150.0f/mx;
      for(int i=0;i<3;i++){
        int y=134+i*44; DT(nm[i],x+14,y+6,AL_L,C_SUB,F2);
        RR(x+14,y+16,196,12,6,C_CARD2); if(vals[i]>0) RR(x+14,y+16,imax(6,(int)(vals[i]*kp)),12,6,i==2?c:mix(C_CARD,c,120));
        snprintf(b,sizeof b,"%.1f",vals[i]); DT(vals[i]>0?b:"--",x+210,y+6,AL_R,C_TXT,F2);
      }
      if(vp>0&&vc>0) { snprintf(b,sizeof b,"%+.0f%% vs prev",(vc-vp)/vp*100.0f); DT(b,x+210,262,AL_R,C_SUB,F2); }
    }
  }
}

static void tapCompare(){
  if(inR(tx,ty,10,64,250,26)){ uint8_t t=(tx<135)?0:1; if(t!=cmpTab){ cmpTab=t; needFull=true; } }
}


// ===========================================================================
//  TAKE-TEST FLOW : setup -> zero + countdown -> 3 live trials -> results + save
// ===========================================================================
#define GCX 124
#define GCY 172
#define GR0 80
#define GR1 102
#define GSEG 48
#define GA0 (-120.0f)
#define GSW 240.0f
#define GMAX 20.0f
static const char* HANDN[2]={"Left","Right"};
static const char* POSTN[2]={"Sitting","Standing"};
static void countdownDraw(int c){
  G=&tft; BGR(192,128,96,96); char b[4]; snprintf(b,sizeof b,"%d",c<1?1:c);
  G->setTextSize(2); DT(b,240,176,AL_C,C_TXT,F24B); G->setTextSize(1);
}
static void countdownRing(float f){ G=&tft; arcRing(240,176,72,88,0,360*clampf(f,0,1),C_TEAL,6); }

// ---- live screen ----
static void gaugeStatic(const Seed* s){
  G=&tft;
  for(int i=0;i<GSEG;i++) arcQuad(GCX,GCY,GR0,GR1,GA0+i*GSW/GSEG,GA0+(i+1)*GSW/GSEG+0.7f,C_CARD2);
  arcRing(GCX,GCY,GR1+4,GR1+8,GA0+GSW*s->lo/GMAX,GA0+GSW*s->hi/GMAX,mix(C_BG,C_OK,170),4);
  DT("0",GCX-72,GCY+62,AL_C,C_DIM,F2); DT("20",GCX+72,GCY+62,AL_C,C_DIM,F2);
  gDrawn=0;
}
static void gaugeUpdate(float v){
  G=&tft; int n=(int)(clampf(v/GMAX,0,1)*GSEG+0.5f);
  if(n>gDrawn){ for(int i=gDrawn;i<n;i++) arcQuad(GCX,GCY,GR0,GR1,GA0+i*GSW/GSEG,GA0+(i+1)*GSW/GSEG+0.7f,gcol(C_G1,C_G2,i,GSEG)); }
  else if(n<gDrawn){ for(int i=n;i<gDrawn;i++) arcQuad(GCX,GCY,GR0,GR1,GA0+i*GSW/GSEG,GA0+(i+1)*GSW/GSEG+0.7f,C_CARD2); }
  gDrawn=n;
}
static void liveNumber(){
  G=&tft; BGR(GCX-58,GCY-42,116,100); char b[16];
  snprintf(b,sizeof b,"%.1f",T_.val); DT(b,GCX,GCY-12,AL_C,C_TXT,F24B); DT("kg",GCX,GCY+20,AL_C,C_SUB,F9);
  snprintf(b,sizeof b,"peak %.1f",T_.peak); DT(b,GCX,GCY+44,AL_C,C_SUB,F9);
  T_.shown=T_.val; T_.shownPk=T_.peak;
}
static void liveTitle(){
  G=&tft; BGR(0,26,480,32); char b[56];
  snprintf(b,sizeof b,"Trial %d of 3",T_.trial+1); DT(b,14,42,AL_L,C_TEAL,F12B);
  snprintf(b,sizeof b,"%s hand | %s",HANDN[T_.hand],POSTN[T_.posture]); DT(b,170,42,AL_L,C_SUB,F9);
  icoClose(456,42,C_SUB); HL(0,58,480,C_LINE);
}
static void liveStatus(const char* s,uint16_t c){ G=&tft; BGR(14,238,222,28); DT(s,GCX,251,AL_C,c,F9B); }
static void liveBar(float f,uint16_t c){ G=&tft; RR(44,270,160,6,3,C_CARD2); if(f>0.01f) RR(44,270,(int)(160*clampf(f,0,1)),6,3,c); }
static void liveChips(){
  G=&tft; BGR(8,280,236,34); char b[16];
  for(int i=0;i<3;i++){
    int x=14+i*76; bool done=(i<T_.trial)||(i==T_.trial&&T_.ph==TP_REST); bool act=(i==T_.trial&&!done);
    RR(x,284,70,26,13,done?mix(C_CARD,C_OK,70):C_CARD); if(act) RO(x,284,70,26,13,C_TEAL);
    if(done) snprintf(b,sizeof b,"T%d %.1f",i+1,T_.tr[i]); else snprintf(b,sizeof b,"T%d --",i+1);
    DT(b,x+35,297,AL_C,done?C_OK:(act?C_TXT:C_DIM),F2);
  }
}

static bool testBlocked(){
  if(!sdOk){ modalOpen(M_NOSD); return true; }
  if(!claimed){ modalOpen(M_UNPAIRED); return true; }
  if(batPresent&&batPct>=0&&batPct<=BAT_CRIT_PCT&&!batChg){ modalOpen(M_BATT_CRIT); return true; }
  if(!hxOk){ toastC("Load cell not detected",C_BAD); return true; }
  return false;
}
static void testOpen(uint8_t hand,uint8_t posture,int32_t aid){
  Scr b=(scr==S_TEST)?scrBack:scr;
  memset(&T_,0,sizeof(T_)); T_.hand=hand; T_.posture=posture; T_.assessId=aid; T_.ph=TP_SETUP; T_.phT=millis();
  goB(S_TEST,b);
}
static void testFromUI(uint8_t hand,uint8_t posture,int32_t aid){ if(testBlocked()) return; testOpen(hand,posture,aid); }
static void testExit(){ goB((scrBack==S_TEST)?S_HOME:scrBack,S_HOME); }

static void drawTestSetup(){
  G=&tft; titleBar("Take Test"); bool lock=(T_.assessId!=0);
  RR(10,64,236,248,16,C_CARD);
  DT(lock?"Assigned assessment":"Quick test",24,84,AL_L,C_TXT,F9B); DT("3 trials, strongest press counts",24,104,AL_L,C_SUB,F2);
  DT("Hand",24,134,AL_L,C_SUB,F9);
  for(int i=0;i<2;i++){ int x=24+i*104; bool a=(T_.hand==i); uint16_t c=i?C_R:C_L;
    RR(x,146,98,32,16,a?c:C_CARD2); DT(HANDN[i],x+49,162,AL_C,a?C_INK:(lock?C_DIM:C_SUB),F9B); }
  DT("Posture",24,200,AL_L,C_SUB,F9);
  for(int i=0;i<2;i++){ int x=24+i*104; bool a=(T_.posture==i);
    RR(x,212,98,32,16,a?C_TEAL:C_CARD2); DT(POSTN[i],x+49,228,AL_C,a?C_INK:(lock?C_DIM:C_SUB),F9B); }
  DT("Keep your hand off the dome until",24,272,AL_L,C_DIM,F2); DT("the countdown ends (scale zeroes).",24,292,AL_L,C_DIM,F2);
  RR(254,64,216,184,16,C_CARD);
  FC(362,196,38,RGB(200,210,224)); RR(290,196,144,28,10,C_DEV);
  RR(318,118,88,70,24,C_SKIN); for(int i=0;i<4;i++) RR(322+i*21,84,18,50,9,C_SKIN);
  if(T_.hand==1) RR(290,138,40,18,9,C_SKIN); else RR(406,138,40,18,9,C_SKIN);
  DT("Place palm centred on the dome",362,236,AL_C,C_SUB,F2);
  BTN(254,256,216,56,"Start Test",C_TEAL,C_INK); icoPlay(300,284,C_INK);
}
static void testBegin(){ T_.ph=TP_READY; T_.phT=millis(); T_.cdShown=99; T_.zeroed=false; needFull=true; }
static void drawTestReady(){
  G=&tft; titleBar("Get ready"); char b[48];
  arcRing(240,176,72,88,0,360,C_CARD2,6);
  snprintf(b,sizeof b,"%s hand | %s",HANDN[T_.hand],POSTN[T_.posture]); DT(b,240,284,AL_C,C_SUB,F9);
  DT("Hands off the dome - zeroing the scale",240,306,AL_C,C_DIM,F2);
}

static void liveStats(){
  G=&tft; RR(250,60,224,144,16,C_CARD); char b[24];
  DT("Target range",262,76,AL_L,C_SUB,F9); snprintf(b,sizeof b,"%.0f - %.0f kg",PROF.lo,PROF.hi); DT(b,262,98,AL_L,C_OK,F12B);
  DT("Peak this trial",262,128,AL_L,C_SUB,F9); snprintf(b,sizeof b,"%.1f",T_.peak); DT(b,262,166,AL_L,C_TXT,F24B);
  int tw=TW(b,F24B); DT("kg",262+tw+6,176,AL_L,C_SUB,F9);
}
static void sparkStatic(){
  G=&tft; RR(250,210,224,102,16,C_CARD); DT("Force vs time",262,224,AL_L,C_SUB,F9);
  int py=240, ph=60; int yH=py+ph-(int)(ph*PROF.hi/GMAX), yL=py+ph-(int)(ph*PROF.lo/GMAX);
  FR(262,yH,200,yL-yH,mix(C_CARD,C_OK,36)); HL(262,py+ph,200,C_LINE);
}
static void sparkAdd(){                                   // draw only the newest segment (no flicker)
  if(T_.spN<2) return; int i=T_.spN-1; int py=240, ph=60;
  int x0=262+(200*(i-1))/60, x1=262+(200*i)/60;
  int y0=py+ph-(int)(ph*clampf(T_.sp[i-1]/GMAX,0,1)), y1=py+ph-(int)(ph*clampf(T_.sp[i]/GMAX,0,1));
  G=&tft; LN(x0,y0,x1,y1,C_TEAL); LN(x0,y0+1,x1,y1+1,C_TEAL);
}
static void drawLiveStatic(){
  G=&tft; liveTitle(); gaugeStatic(&PROF); gaugeUpdate(T_.val); liveNumber(); liveStats(); sparkStatic(); liveChips();
  if(T_.ph==TP_WAIT) liveStatus("Press the dome with your palm",C_TXT);
  else if(T_.ph==TP_APPLY) liveStatus("Keep pressing...",C_TXT);
  else { liveStatus("Recorded - release your hand",C_OK); liveBar(1,C_OK); }
  if(T_.ph!=TP_REST) liveBar(0,C_TEAL);
}
static void startTrial(int k){
  T_.trial=(uint8_t)k; T_.ph=TP_WAIT; T_.phT=millis(); T_.val=T_.peak=T_.prev=0; T_.spN=0; T_.stableT=0; T_.shown=-1; T_.shownPk=-1;
#if MOCK_HX711
  mockTrialReset();   // reset mock pressure curve for each new trial
#endif
  needFull=true;
}
static void finishTrial(uint32_t now){
  T_.tr[T_.trial]=T_.peak; T_.val=T_.peak; T_.ph=TP_REST; T_.phT=now; beepTrial();
  gaugeUpdate(T_.val); liveNumber(); liveStats(); liveStatus("Recorded - release your hand",C_OK); liveBar(1,C_OK); liveChips();
}
static void liveSample(uint32_t now,float v){            // same rule as the original firmware
  if(v<0) v=0;
  if(T_.ph==TP_WAIT){
    T_.val=v; gaugeUpdate(v); if(fabsf(v-T_.shown)>0.04f){ liveNumber(); }
    if(v>MIN_TRIGGER_KG){ T_.ph=TP_APPLY; T_.prev=v; T_.peak=v; T_.stableT=now; T_.phT=now; liveStatus("Keep pressing...",C_TXT); }
    return;
  }
  T_.val=v;
  if(v>T_.peak){ T_.peak=v; T_.stableT=now; }
  if(T_.spN<64) T_.sp[T_.spN++]=v;
  bool stable=(fabsf(v-T_.prev)<STABLE_TOL_KG); T_.prev=v;
  if(!stable) T_.stableT=now;
  static bool lastStable=false;
  if(stable!=lastStable){ lastStable=stable; liveStatus(stable?"Hold steady...":"Keep pressing...",stable?C_TEAL:C_TXT); }
  gaugeUpdate(v);
  if(fabsf(T_.val-T_.shown)>0.04f||T_.peak!=T_.shownPk){ liveNumber(); liveStats(); }
  liveBar((now-T_.stableT)/(float)STABLE_MS,C_TEAL); sparkAdd();
  if((now-T_.stableT>STABLE_MS)||(now-T_.phT>15000)) finishTrial(now);
}

static void commitHistory(float best){
  Patient& p=pts[cur]; uint32_t e=nowEpoch();
  T_.prevBest=(p.n>0)?(T_.hand?p.R[p.n-1]:p.L[p.n-1]):0;
  bool same=(p.n>0&&e&&p.ts[p.n-1]&&dayNumber(p.ts[p.n-1])==dayNumber(e));
  if(!same){
    if(p.n>=MAXS){ for(int i=0;i<MAXS-1;i++){ p.L[i]=p.L[i+1]; p.R[i]=p.R[i+1]; p.ts[i]=p.ts[i+1]; } p.n=MAXS-1; }
    int i=p.n; p.L[i]=(i>0)?p.L[i-1]:0; p.R[i]=(i>0)?p.R[i-1]:0; p.ts[i]=e; p.n++;
  }
  int i=p.n-1; if(T_.hand) p.R[i]=best; else p.L[i]=best;
  p.todayOpen=true; p.todayBest[T_.hand]=best; p.tests++;
}
static void enterDone(){
  float best=fmaxf(T_.tr[0],fmaxf(T_.tr[1],T_.tr[2]));
  commitHistory(best); historySave();
  T_.saved=pendingSave(T_.hand,T_.posture,T_.assessId,T_.tr,best);        // SD first, always
#if TEST_MODE
  Serial.printf("[TEST] ===== TEST COMPLETE =====\n");
  Serial.printf("[TEST] Hand: %s | Posture: %s\n", T_.hand?"Right":"Left", T_.posture?"Standing":"Sitting");
  Serial.printf("[TEST] Trial 1: %.2f kg | Trial 2: %.2f kg | Trial 3: %.2f kg\n", T_.tr[0], T_.tr[1], T_.tr[2]);
  Serial.printf("[TEST] Best: %.2f kg | SD saved: %s\n", best, T_.saved?"YES":"NO");
  Serial.printf("[TEST] Triggering Supabase cloud sync...\n");
#endif
  if(T_.assessId) for(int i=0;i<queueN;i++) if(queueItems[i].id==T_.assessId) queueItems[i].done=true;
  reqSync=true; T_.ph=TP_DONE; T_.doneT=millis(); needFull=true; if(T_.saved) beepOk(); else beepErr();
}
static void drawSyncRow(){
  G=&tft; BGR(10,252,460,28); uint32_t now=millis();
  if(!T_.saved){ FC(24,266,9,C_BAD); icoClose(24,266,C_WHITE); DT("NOT SAVED - check the SD card",42,266,AL_L,C_BAD,F9B); return; }
  if(pendingCnt==0&&cloudOk){ FC(24,266,9,C_OK); icoCheck(24,265,C_INK); DT("Saved and synced to the cloud",42,266,AL_L,C_OK,F9); }
  else if(netState!=NS_ONLINE){ FC(24,266,9,C_WARN); icoWarn(24,266,C_INK); DT("Saved on SD - uploads when Wi-Fi returns",42,266,AL_L,C_WARN,F9); }
  else { OC(24,266,8,C_TEAL); float a=((now/110)%12)*30.0f*0.0174533f; FC(24+(int)(6*sinf(a)),266-(int)(6*cosf(a)),2,C_TEAL); DT("Saved on SD - uploading...",42,266,AL_L,C_SUB,F9); }
}
static void drawTestDone(){
  G=&tft; const Patient& p=pts[cur]; char b[48];
  BGR(0,26,480,32); FC(24,42,10,C_OK); icoCheck(24,41,C_INK); DT("Assessment complete",42,42,AL_L,C_TXT,F12B);
  snprintf(b,sizeof b,"%s hand | %s",HANDN[T_.hand],POSTN[T_.posture]); DT(b,468,42,AL_R,C_SUB,F9); HL(0,58,480,C_LINE);
  float best=fmaxf(T_.tr[0],fmaxf(T_.tr[1],T_.tr[2])), avg=(T_.tr[0]+T_.tr[1]+T_.tr[2])/3.0f;
  float fat=(T_.tr[0]>0)?(T_.tr[0]-T_.tr[2])/T_.tr[0]*100.0f:0;
  RR(10,64,236,142,16,C_CARD); DT("Trials (kg)",24,80,AL_L,C_SUB,F9);
  float mx=fmaxf(best*1.15f,10); uint16_t hc=T_.hand?C_R:C_L;
  for(int i=0;i<3;i++){
    int x=30+i*70, hgt=(int)(80*T_.tr[i]/mx); bool isb=(T_.tr[i]>=best-0.001f);
    RR(x,178-hgt,44,hgt,6,isb?hc:mix(C_CARD,hc,110));
    snprintf(b,sizeof b,"%.1f",T_.tr[i]); DT(b,x+22,178-hgt-9,AL_C,C_TXT,F2);
    snprintf(b,sizeof b,"T%d",i+1); DT(b,x+22,194,AL_C,C_SUB,F2);
  }
  GRR(254,64,216,142,18,C_HERO1,C_HERO2);
  DT("BEST",270,82,AL_L,RGB(190,200,255),F9); snprintf(b,sizeof b,"%.1f",best); DT(b,270,116,AL_L,C_WHITE,F24B); int tw=TW(b,F24B); DT("kg",270+tw+6,126,AL_L,C_SUB,F9);
  DT("AVERAGE",270,152,AL_L,RGB(190,200,255),F2); snprintf(b,sizeof b,"%.1f kg",avg); DT(b,270,170,AL_L,C_TXT,F9B);
  DT("FATIGUE",370,152,AL_L,RGB(190,200,255),F2); snprintf(b,sizeof b,"%.0f%%",fat); DT(b,370,170,AL_L,fat>10?C_WARN:C_OK,F9B);
  Insight in; computeInsight(p,in);
  RR(10,212,460,34,14,C_CARD);
  if(T_.prevBest>0){ DT("vs last test",24,229,AL_L,C_SUB,F9); arrowDelta(130,229,best-T_.prevBest,AL_L); }
  else DT("First result for this hand",24,229,AL_L,C_SUB,F9);
  if(in.asym>0){ snprintf(b,sizeof b,"Gap now %.0f%% | %s",in.asym,in.sev>=3?"alert":(in.sev==2?"watch":"balanced")); DT(b,462,229,AL_R,sevColor(in.sev),F9B); }
  drawSyncRow();
  BTNO(10,284,144,30,"Retest",C_LINE,C_TXT); BTNO(168,284,144,30,"Compare",C_LINE,C_TXT); BTN(326,284,144,30,"Done",C_TEAL,C_INK);
}
static void drawTestScreen(){
  switch(T_.ph){ case TP_SETUP: drawTestSetup(); break; case TP_READY: drawTestReady(); break; case TP_DONE: drawTestDone(); break; default: drawLiveStatic(); break; }
}
static void testTick(uint32_t now){
  float kg;
  switch(T_.ph){
    case TP_SETUP: break;
    case TP_READY: {
      if(!T_.zeroed){ T_.zeroed=true; hxZero(); T_.phT=millis(); now=T_.phT; T_.cdShown=99; }
      uint32_t el=now-T_.phT; int c=3-(int)(el/1000); static uint32_t la=0;
      if(c!=T_.cdShown){ T_.cdShown=(uint8_t)c; countdownDraw(c); }
      if(now-la>70){ la=now; countdownRing(el/3000.0f); }
      if(el>=3000){ beepTrial(); startTrial(0); }
      break; }
    case TP_WAIT: case TP_APPLY: if(hxPoll(&kg)) liveSample(now,kg); break;
    case TP_REST: if(now-T_.phT>1900){ if(T_.trial<2){ startTrial(T_.trial+1); } else enterDone(); } break;
    case TP_DONE: { static uint32_t la=0; if(now-la>500){ la=now; drawSyncRow(); } break; }
  }
}
static void tapTest(){
  bool back=inR(tx,ty,0,26,100,32);
  if(T_.ph==TP_SETUP){
    if(back){ testExit(); return; }
    if(T_.assessId==0) for(int i=0;i<2;i++){ if(inR(tx,ty,24+i*104,146,98,32)){ T_.hand=(uint8_t)i; needFull=true; } if(inR(tx,ty,24+i*104,212,98,32)){ T_.posture=(uint8_t)i; needFull=true; } }
    if(inR(tx,ty,254,256,216,56)) testBegin();
  } else if(T_.ph==TP_READY){ if(back) testExit(); }
  else if(T_.ph==TP_DONE){
    if(inR(tx,ty,10,284,144,30)){ uint8_t h=T_.hand,ps=T_.posture; int32_t a=T_.assessId; testOpen(h,ps,a); }
    else if(inR(tx,ty,168,284,144,30)) goB(S_COMPARE,S_HOME);
    else if(inR(tx,ty,326,284,144,30)){ goB(S_HOME,S_HOME); toast(T_.saved?"Result saved":"Result NOT saved"); }
  } else { if(inR(tx,ty,420,26,60,32)) modalOpen(M_EXIT_TEST); }
}

// ===========================================================================
//  SCREEN DISPATCH, EVENTS, INPUT, MAIN LOOP
// ===========================================================================
static void drawSplash(){
  G=&tft; FC(240,100,46,C_TEAL);
  int cx=240, cy=100; int px[6]={-30,-12,-6,6,12,30}, py[6]={0,0,-26,26,0,0};
  for(int i=0;i<5;i++){ LN(cx+px[i],cy+py[i],cx+px[i+1],cy+py[i+1],C_INK); LN(cx+px[i],cy+py[i]+1,cx+px[i+1],cy+py[i+1]+1,C_INK); LN(cx+px[i]+1,cy+py[i],cx+px[i+1]+1,cy+py[i+1],C_INK); }
  DT("VitalStep",240,170,AL_C,C_TXT,F24B); DT("Palm Pressure Monitor",240,204,AL_C,C_SUB,F9);
  RR(140,254,200,8,4,C_CARD2);
}
static bool imgSize(const char* path,int* w,int* h){
  if(!sdOk) return false; bool ok=false; bool png=(strstr(path,".png")!=nullptr); sdLock();
  File f=SD.open(path);
  if(f){
    if(png){ uint8_t hd[24]; if(f.read(hd,24)==24&&hd[1]=='P'&&hd[2]=='N'&&hd[3]=='G'){ *w=(hd[18]<<8)|hd[19]; *h=(hd[22]<<8)|hd[23]; ok=true; } }
    else if(f.read()==0xFF&&f.read()==0xD8){
      while(f.available()){
        int m=f.read(); if(m!=0xFF) continue; int mk=f.read(); while(mk==0xFF) mk=f.read();
        if(mk>=0xC0&&mk<=0xCF&&mk!=0xC4&&mk!=0xC8&&mk!=0xCC){ f.read(); f.read(); f.read(); int hh=f.read()<<8; hh|=f.read(); int ww=f.read()<<8; ww|=f.read(); *w=ww; *h=hh; ok=true; break; }
        if(mk==0xD8||mk==0x01||(mk>=0xD0&&mk<=0xD7)||mk<0) continue;
        int len=f.read()<<8; len|=f.read(); if(len<2) break; f.seek(f.position()+len-2);
      }
    }
    f.close();
  }
  sdUnlock(); return ok;
}
// Logo: put logo.jpg (or logo.png, max 420x150 px) in the /vs folder of the SD card.
static bool logoDraw(int cx,int cy){
  // Logo drawing removed - LovyanGFX DataWrapper compatibility issue with SDFS
  // Device will boot without logo, all features work fine
  return false;
}
static void pinNew(){ snprintf(pairPin,sizeof pairPin,"%06lu",(unsigned long)(esp_random()%1000000UL)); }
static void wipeOwnerData(){                       // privacy: a released device must not show the previous patient
  Patient& pp=pts[cur]; memset(&pp,0,sizeof pp); pp.s=&PROF;
  memset(&PROF,0,sizeof PROF); strlcpy(PROF.ini,"--",sizeof PROF.ini); PROF.lo=10.0f; PROF.hi=18.0f;
  queueN=0;
  if(sdOk){ sdLock(); SD.remove("/vs/history.csv"); SD.remove("/vs/queue.json"); sdUnlock(); }
  profileSave();
}
static void bootStep(const char* msg,int pct){
  G=&tft; BGR(60,272,360,26); DT(msg,240,285,AL_C,C_SUB,F9); GRRH(140,254,imax(8,2*clampi(pct,0,100)),8,4,C_G1,C_G2);
}
static void goB(Scr s,Scr back){
  scr=s; scrBack=back; needFull=true; scrT0=millis(); modal=M_NONE; scrub=-1; toastUntil=0; claimShownT=0;
  Serial.printf("[UI] screen %d  heap %u\n",(int)s,(unsigned)ESP.getFreeHeap());
}
static void go(Scr s){ goB(s,S_HOME); }

static void drawScreen(){
  G=&tft; BGR(0,26,480,294);
  drawStatus();
  switch(scr){
    case S_SPLASH: drawSplash(); break;     case S_SETUP: drawSetup(); break;
    case S_HOME: drawHome(); break;         case S_DASH: drawDash(); break;
    case S_ASSESS: drawAssess(); break;     case S_SETTINGS: drawSettings(); break;
    case S_TEST: drawTestScreen(); break;   case S_COMPARE: drawCompare(); break;
    case S_INSIGHT: drawInsight(); break;   case S_CALIB: drawCalib(); break;
  }
  G=&tft;
  if(navVisible()) drawNav(scr==S_HOME?0:(scr==S_DASH?1:(scr==S_ASSESS?2:3)));
  if(toastUntil>millis()) drawToast();
  if(modal!=M_NONE) drawModal();
}

static void processNetEvents(){
  bool refresh=false;
  if(evProfile){
    evProfile=false;
    if(profInValid){ PROF=profIn; PROF.ini[0]=PROF.name[0]?PROF.name[0]:'-'; PROF.ini[1]=0; }
    profileSave(); statusDirty=true; refresh=true;
  }
  if(evClaim){
    evClaim=false; profileSave(); statusDirty=true; refresh=true;
    if(claimed){ beepOk(); }
    else { wipeOwnerData(); if(scr!=S_TEST&&scr!=S_SPLASH){ toastC("Device unpaired - pair it again in the app",C_WARN); go(S_SETUP); } }
  }
  if(evQueue&&scr!=S_TEST){
    evQueue=false; portENTER_CRITICAL(&shMux); memcpy(queueItems,qIn,sizeof qIn); queueN=qInN; portEXIT_CRITICAL(&shMux);
    queueSave(); refresh=true;
  }
  if(evHistory&&scr!=S_TEST&&pendingCnt==0){
    evHistory=false;
    if(histIn.n>0){
      Patient& p=pts[cur]; p.n=histIn.n; for(int i=0;i<p.n;i++){ p.L[i]=histIn.L[i]; p.R[i]=histIn.R[i]; p.ts[i]=histIn.ts[i]; }
      if(p.tests<p.n*2) p.tests=p.n*2; historySave(); refresh=true;
    }
  }
  if(refresh&&(scr==S_HOME||scr==S_DASH||scr==S_ASSESS||scr==S_COMPARE||scr==S_INSIGHT)&&modal==M_NONE) needFull=true;
}
static void statusWatch(uint32_t now){
  static uint32_t last=0, sig=0, sig2=0; if(now-last<500) return; last=now;
  char c[8]; fmtClock(c,sizeof c);
  uint32_t s=(uint32_t)netState*7+cloudOk*13+claimed*17+authFail*19+bleActive*23+(uint32_t)(batPct+2)*29+batChg*31+(uint32_t)pendingCnt*37+(uint32_t)c[4]*41+(uint32_t)c[3]*43+(timeEst?47:0);
  if(s!=sig){ sig=s; statusDirty=true; }
  if(scr==S_SETTINGS&&setPage==0&&modal==M_NONE){
    uint32_t t=s+sdOk*53+hxOk*59+lastSyncEpoch+(uint32_t)(batPackV*10); if(t!=sig2){ sig2=t; needFull=true; }
  }
}
static void ledTick(uint32_t now){
  static uint32_t la=0; static bool ph=false; if(now-la<300) return; la=now; ph=!ph;
  if(batPresent&&batPct>=0&&batPct<=BAT_CRIT_PCT&&!batChg) ledSet(ph,0,0);
  else if(bleActive) ledSet(0,0,1);
  else if(authFail) ledSet(ph,0,0);
  else ledSet(0,0,0);
}
static void pollTouch(){
  int32_t x=0,y=0; bool d=tft.getTouch(&x,&y); ttap=false;
  if(d){ if(!tdown){ if(millis()-tUp>80) ttap=true; tdown=true; } tx=(int)x; ty=(int)y; lastTouchMs=millis(); }
  else { if(tdown) tUp=millis(); tdown=false; }
}
static void handleTouch(){
  static bool pd=false;
  if(ttap&&dimmed){ dimmed=false; applyBrightness(); ttap=false; }                 // first touch only wakes the screen
  if(ttap){
    if(modal!=M_NONE) modalTap();
    else {
      bool sub=(scr==S_COMPARE||scr==S_INSIGHT);
      if(sub&&inR(tx,ty,0,26,100,32)) goB(scrBack,S_HOME);
      else if(navVisible()&&ty>=275){
        int t=clampi(tx/120,0,3); Scr s=(t==0)?S_HOME:((t==1)?S_DASH:((t==2)?S_ASSESS:S_SETTINGS)); if(s!=scr) go(s);
      } else switch(scr){
        case S_SETUP: tapSetup(); break;     case S_HOME: tapHome(); break;
        case S_DASH: tapDash(); break;       case S_ASSESS: tapAssess(); break;
        case S_SETTINGS: tapSettings(); break; case S_TEST: tapTest(); break;
        case S_COMPARE: tapCompare(); break; case S_INSIGHT: tapInsight(); break;
        case S_CALIB: tapCalib(); break;     default: break;
      }
    }
  }
  if(tdown&&scr==S_DASH&&modal==M_NONE) dashDrag();
  if(pd&&!tdown&&scrub>=0&&scr==S_DASH) dashScrubTo(-1);
  pd=tdown;
}
static void tick(uint32_t now){
  batteryUpdate(); timePersist(); statusWatch(now); processNetEvents(); ledTick(now);
  // ← REMOVED: Auto-dim feature was turning off display after 90 seconds
  // if(!dimmed&&now-lastTouchMs>90000UL&&scr!=S_TEST&&!bleActive){ dimmed=true; applyBrightness(); }
  if(toastUntil&&now>toastUntil){ toastUntil=0; if(scr!=S_TEST&&scr!=S_SPLASH&&scr!=S_SETUP&&scr!=S_CALIB) needFull=true; }
  static bool warned=false;
  if(batPresent&&batPct>=0){
    if(batPct<=BAT_LOW_PCT&&!batChg&&!warned&&scr!=S_TEST){ warned=true; toastC("Battery low - please charge",C_BAD); beepErr(); }
    if(batPct>BAT_LOW_PCT+5||batChg) warned=false;
  }
  static uint32_t pinT=0;
  if(!claimed){ if(!pairPin[0]||now-pinT>600000UL){ pinNew(); pinT=now; if(scr==S_SETUP&&modal==M_NONE) needFull=true; } } else pairPin[0]=0;
  if(modal!=M_NONE) return;
  switch(scr){
    case S_SETUP: setupTick(now); break;
    case S_TEST: testTick(now); break;
    case S_CALIB: { static uint32_t la=0; if(calStep==1&&now-la>250){ la=now; calReading(); } break; }
    default: break;
  }
}

void setup(){
  Serial.begin(115200);
  pinMode(PIN_LED_R,OUTPUT); pinMode(PIN_LED_G,OUTPUT); pinMode(PIN_LED_B,OUTPUT); ledSet(0,0,0);
  pinMode(PIN_BOOT,INPUT_PULLUP);
  analogReadResolution(12); analogSetPinAttenuation(PIN_BAT_ADC,ADC_11db);
  tft.init(); tft.setRotation(1); tft.setBrightness(180); tft.setTouchCalibrate(SAVED_CAL);
  G=&tft; BGR(0,0,480,320);
  uint32_t r=esp_random(); snprintf(bootId,sizeof bootId,"%08lx",(unsigned long)r); rs^=r;
  drawSplash(); pinNew();
  bootStep("Loading settings...",8);          optionsLoad(); applyBrightness();
  bootStep("Checking SD card...",22);         sdInit(); if(sdOk) logoDraw(240,98);
  bootStep("Reading device identity...",36);  identityLoad();
  bootStep("Loading Wi-Fi and history...",50); wifiCredsLoad(); timeRestore(); historyLoad(); queueLoad(); pendingCnt=pendingCount();
  bootStep("Reading battery...",62);          batteryUpdate();
  bootStep("Starting load cell...",78);       hxInit();
  bootStep("Starting network...",92);         xTaskCreatePinnedToCore(netTask,"net",16384,nullptr,1,nullptr,0);
  bootStep("Ready",100); delay(500);
  Serial.printf("[BOOT] code=%s ident=%d sd=%d hx=%d creds=%d claimed=%d pending=%d bat=%d%% heap=%u\n",devCode,identOk,sdOk,hxOk,haveCreds,claimed,(int)pendingCnt,batPct,(unsigned)ESP.getFreeHeap());
  bool force=(digitalRead(PIN_BOOT)==LOW);                          // hold BOOT during splash = Wi-Fi setup
#if TEST_MODE
  // In test mode: skip pairing requirement and go straight to home if we have Wi-Fi creds
  if(force){ goB(S_SETUP,S_HOME); if(identOk) bleStart(); }
  else if(!identOk||!haveCreds){ goB(S_SETUP,S_HOME); if(identOk&&!haveCreds) bleStart(); }
  else go(S_HOME);  // TEST MODE: skip straight to home - pairing not required
#else
  if(force||!identOk||!haveCreds||!claimed){ goB(S_SETUP,S_HOME); if(identOk&&(force||!haveCreds)) bleStart(); }
  else go(S_HOME);
#endif
  lastTouchMs=millis();
}
void loop(){
  uint32_t tStart = millis();  // ← FIX: Performance measurement
  uint32_t now=millis();
  pollTouch(); 
  checkYield();  // ← FIX: Allow touch ISR
  handleTouch(); 
  checkYield();  // ← FIX: Allow touch ISR
  tick(now);
  checkYield();  // ← FIX: Allow touch ISR
  if(needFull){ needFull=false; drawScreen(); }
  else if(statusDirty) drawStatus();
  checkYield();  // ← FIX: Allow touch ISR
  uint32_t elapsed = millis() - tStart;  // ← FIX: Performance measurement
  
  // ← FIX: Debug output - print slow frames
  if(elapsed > 50){
    Serial.printf("[PERF] Loop cycle took %lu ms (buttons responsive: %s)\n", 
                  elapsed, elapsed<100?"YES":"MAYBE_SLOW");
  }
  
  delay(3);
}
