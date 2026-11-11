import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/device.dart';

class SupabaseService {
  static final SupabaseService _instance = SupabaseService._internal();

  factory SupabaseService() {
    return _instance;
  }

  SupabaseService._internal();

  late SupabaseClient _client;

  Future<void> initialize() async {
    await Supabase.initialize(
      url: 'https://oyqecdcpicvzwwvwaeka.supabase.co',
      anonKey: 'sb_publishable_5ovuyYHtObqNMcjEFrNo6Q_Bo4dDFQi',
    );
    _client = Supabase.instance.client;
  }

  SupabaseClient get client => _client;

  // Auth methods
  Future<AuthResponse> signUp(String email, String password) {
    return _client.auth.signUp(
      email: email,
      password: password,
    );
  }

  Future<AuthResponse> signIn(String email, String password) {
    return _client.auth.signInWithPassword(
      email: email,
      password: password,
    );
  }

  Future<void> signOut() {
    return _client.auth.signOut();
  }

  User? getCurrentUser() {
    return _client.auth.currentUser;
  }

  Stream<AuthState> authStateChanges() {
    return _client.auth.onAuthStateChange;
  }

  // Device methods
  Future<List<Device>> getDevices() async {
    final user = getCurrentUser();
    if (user == null) throw Exception('Not authenticated');

    final response = await _client
        .from('devices')
        .select()
        .eq('user_id', user.id)
        .order('created_at', ascending: false);

    return (response as List)
        .map((e) => Device.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Device?> getDeviceByCode(String code) async {
    final response = await _client
        .from('devices')
        .select()
        .eq('device_code', code)
        .maybeSingle();

    return response != null ? Device.fromJson(response) : null;
  }

  Future<Device> pairDevice(String deviceCode, String userId, String deviceName) async {
    // Call Edge Function to pair device
    final response = await _client.functions.invoke(
      'device-sync',
      body: {
        'action': 'pair',
        'device_code': deviceCode,
        'user_id': userId,
        'device_name': deviceName,
      },
    );

    final result = (response as Map<String, dynamic>);
    if (result['ok'] != true) {
      throw Exception(result['error'] ?? 'Failed to pair device');
    }

    return Device(
      id: result['device_id'] ?? deviceCode,
      code: deviceCode,
      userId: userId,
      name: deviceName,
      paired: true,
      online: false,
      batteryPct: 0,
      lastSync: DateTime.now(),
      createdAt: DateTime.now(),
    );
  }

  Future<void> unpairDevice(String deviceId) async {
    await _client.from('devices').update({'paired': false}).eq('id', deviceId);
  }

  Future<void> renameDevice(String deviceId, String newName) async {
    await _client.from('devices').update({'name': newName}).eq('id', deviceId);
  }

  // Measurement methods
  Future<List<Measurement>> getMeasurements(String deviceId, {int limit = 50}) async {
    final response = await _client
        .from('measurements')
        .select()
        .eq('device_id', deviceId)
        .order('recorded_at', ascending: false)
        .limit(limit);

    return (response as List)
        .map((e) => Measurement.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<Measurement>> getMeasurementsByHand(
    String deviceId,
    String hand, {
    int limit = 50,
  }) async {
    final response = await _client
        .from('measurements')
        .select()
        .eq('device_id', deviceId)
        .eq('hand', hand)
        .order('recorded_at', ascending: false)
        .limit(limit);

    return (response as List)
        .map((e) => Measurement.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<Measurement>> getMeasurementsByDateRange(
    String deviceId,
    DateTime startDate,
    DateTime endDate,
  ) async {
    final response = await _client
        .from('measurements')
        .select()
        .eq('device_id', deviceId)
        .gte('recorded_at', startDate.toIso8601String())
        .lte('recorded_at', endDate.toIso8601String())
        .order('recorded_at', ascending: false);

    return (response as List)
        .map((e) => Measurement.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Measurement> saveMeasurement(Measurement measurement) async {
    final data = measurement.toJson();
    
    final response = await _client
        .from('measurements')
        .insert(data)
        .select()
        .single();

    return Measurement.fromJson(response);
  }

  // Insight methods
  Future<List<Insight>> getInsights(String assessmentId) async {
    final response = await _client
        .from('insights')
        .select()
        .eq('assessment_id', assessmentId)
        .order('generated_at', ascending: false);

    return (response as List)
        .map((e) => Insight.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Insight?> getLatestInsight(String deviceId) async {
    final response = await _client
        .from('insights')
        .select()
        .eq('device_id', deviceId)
        .order('generated_at', ascending: false)
        .limit(1)
        .maybeSingle();

    return response != null ? Insight.fromJson(response) : null;
  }

  // Real-time subscriptions
  RealtimeChannel subscribeToDeviceUpdates(String deviceId) {
    return _client
        .channel('device:$deviceId')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'measurements',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'device_id',
            value: deviceId,
          ),
        )
        .subscribe();
  }

  void unsubscribeFromUpdates(String channelName) {
    _client.removeChannel(_client.channel(channelName));
  }

  // Test data generation
  Future<void> generateTestData(String deviceId) async {
    // Generate realistic test measurements
    final now = DateTime.now();
    final measurements = <Measurement>[];

    for (int i = 0; i < 10; i++) {
      final hand = i % 2 == 0 ? 'L' : 'R';
      final posture = i % 3 == 0 ? 'standing' : 'sitting';
      final recordedAt = now.subtract(Duration(days: i));

      // Generate realistic trial data
      final trials = <MeasurementTrial>[];
      double peak = 0;
      double sum = 0;

      for (int t = 0; t < 3; t++) {
        final reading = 8.0 + (t * 0.5) + (5.0 * (1 - (i / 10))); // Realistic progression
        trials.add(MeasurementTrial(
          trialNumber: t + 1,
          reading: reading,
          recordedAt: recordedAt.add(Duration(seconds: t * 30)),
          duration: 3000,
        ));
        peak = reading > peak ? reading : peak;
        sum += reading;
      }

      measurements.add(Measurement(
        id: 'test_$i',
        deviceId: deviceId,
        assessmentId: 'test_assess_$i',
        hand: hand,
        posture: posture,
        trials: trials,
        peakReading: peak,
        averageReading: sum / 3,
        recordedAt: recordedAt,
        createdAt: recordedAt,
      ));
    }

    // Save all measurements
    for (final measurement in measurements) {
      await saveMeasurement(measurement);
    }
  }
}
