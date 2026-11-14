/* ======================================================================
   SD CARD CONTENTS READER & PRINTER UTILITY
   
   PURPOSE: Read all files from SD card and print contents to Serial
   OUTPUT: Formatted display of all files with their contents
   
   WIRING (same as main device):
   - SD_CS_PIN      = 5
   - SD_SCK_PIN     = 18
   - SD_MISO_PIN    = 19
   - SD_MOSI_PIN    = 23
   - GND, 3.3V
   
   UPLOAD: Select "ESP32 Dev Module", upload this sketch
   OUTPUT: Open Serial Monitor (115200 baud), see all SD card files
   
   ====================================================================== */

#include <SPI.h>
#include <SD.h>

// Pin definitions (same as VitalStep_Device_fixed.ino)
#define SD_CS_PIN      5
#define SD_SCK_PIN    18
#define SD_MISO_PIN   19
#define SD_MOSI_PIN   23

// ======================================================================
//  SETUP & LOOP
// ======================================================================

void setup() {
  Serial.begin(115200);
  delay(2000);
  
  Serial.println("\n\n");
  Serial.println("╔════════════════════════════════════════════════════════════╗");
  Serial.println("║           SD CARD CONTENTS READER & PRINTER                 ║");
  Serial.println("║         VitalStep Device File Inventory Utility             ║");
  Serial.println("╚════════════════════════════════════════════════════════════╝");
  Serial.println();
  
  // Initialize SD card
  Serial.print("Initializing SD card... ");
  if (!SD.begin(SD_CS_PIN, SPI, 4000000)) {
    Serial.println("FAILED!");
    Serial.println("═══════════════════════════════════════════════════════════");
    Serial.println("ERROR: Could not initialize SD card.");
    Serial.println("Check wiring:");
    Serial.println("  CS   → GPIO 5");
    Serial.println("  SCK  → GPIO 18");
    Serial.println("  MISO → GPIO 19");
    Serial.println("  MOSI → GPIO 23");
    Serial.println("  GND  → GND");
    Serial.println("  3.3V → 3.3V");
    Serial.println("═══════════════════════════════════════════════════════════");
    while(1) delay(1000);
  }
  Serial.println("OK ✓");
  Serial.println();
  
  // Get card info
  uint32_t cardSize = SD.cardSize() / (1024 * 1024); // MB
  Serial.printf("SD Card Size: %u MB\n\n", cardSize);
  
  Serial.println("═══════════════════════════════════════════════════════════");
  Serial.println("READING ROOT DIRECTORY:");
  Serial.println("═══════════════════════════════════════════════════════════");
  Serial.println();
  
  // Read root directory
  File root = SD.open("/");
  if (!root) {
    Serial.println("ERROR: Could not open root directory!");
    return;
  }
  
  int fileCount = 0;
  unsigned long totalSize = 0;
  
  // First pass: count and list files
  File file = root.openNextFile();
  while (file) {
    if (!file.isDirectory()) {  // isDirectory() returns true for dirs, so !isDirectory() = file
      fileCount++;
      totalSize += file.size();
      Serial.printf("[FILE %d] %s (%d bytes)\n", fileCount, file.name(), file.size());
    }
    file = root.openNextFile();
  }
  
  root.close();
  
  Serial.println();
  Serial.printf("Total files: %d\n", fileCount);
  Serial.printf("Total size: %lu bytes (%.2f KB)\n\n", totalSize, (float)totalSize / 1024.0);
  
  Serial.println("═══════════════════════════════════════════════════════════");
  Serial.println("READING FILE CONTENTS:");
  Serial.println("═══════════════════════════════════════════════════════════");
  Serial.println();
  
  // Second pass: read and print contents
  root = SD.open("/");
  int fileNum = 0;
  
  file = root.openNextFile();
  while (file) {
    if (!file.isDirectory()) {  // isDirectory() returns true for dirs, so !isDirectory() = file
      fileNum++;
      
      Serial.printf("┌─ FILE %d: %s (%d bytes) \n", fileNum, file.name(), file.size());
      Serial.println("├─────────────────────────────────────────────────────────");
      
      // Read and print file contents
      if (file.size() == 0) {
        Serial.println("│  [EMPTY FILE]");
      } else if (file.size() > 10000) {
        Serial.printf("│  [FILE TOO LARGE: %d bytes - truncating first 1000 chars]\n", file.size());
        printFileContents(file, 1000);
      } else {
        printFileContents(file, file.size());
      }
      
      Serial.println("└─────────────────────────────────────────────────────────");
      Serial.println();
    }
    file = root.openNextFile();
  }
  
  root.close();
  
  Serial.println("═══════════════════════════════════════════════════════════");
  Serial.println("SCAN COMPLETE!");
  Serial.println("═══════════════════════════════════════════════════════════");
  Serial.println();
  Serial.println("Instructions:");
  Serial.println("1. Copy all the file contents above");
  Serial.println("2. Paste into the admin dashboard");
  Serial.println("3. Dashboard will use these as template for new devices");
  Serial.println();
}

void loop() {
  delay(1000);
}

// ======================================================================
//  HELPER FUNCTIONS
// ======================================================================

void printFileContents(File file, size_t maxBytes) {
  file.seek(0); // Reset to beginning
  
  size_t bytesRead = 0;
  char buffer[256];
  bool isText = true;
  
  // Read and print
  while (file.available() && bytesRead < maxBytes) {
    size_t remaining = maxBytes - bytesRead;
    size_t bufferSize = sizeof(buffer) - 1;
    size_t readSize = (remaining < bufferSize) ? remaining : bufferSize;
    
    int len = file.readBytes(buffer, readSize);
    
    // Check if text
    for (int i = 0; i < len; i++) {
      if (buffer[i] < 32 && buffer[i] != '\n' && buffer[i] != '\r' && buffer[i] != '\t') {
        isText = false;
        break;
      }
    }
    
    // Print with line prefix
    for (int i = 0; i < len; i++) {
      if (i == 0) Serial.print("│  ");
      
      if (buffer[i] == '\n') {
        Serial.print("\n│  ");
      } else if (buffer[i] == '\r') {
        // Skip carriage return
      } else {
        Serial.write(buffer[i]);
      }
    }
    
    bytesRead += len;
  }
  
  if (!isText) {
    Serial.println("[BINARY DATA - cannot display as text]");
  }
  
  Serial.println();
}

void printHex(const char* label, uint8_t* data, size_t len) {
  Serial.printf("│  %s: ", label);
  for (size_t i = 0; i < len; i++) {
    Serial.printf("%02x", data[i]);
  }
  Serial.println();
}
