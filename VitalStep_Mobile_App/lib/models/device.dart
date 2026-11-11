import 'package:json_annotation/json_annotation.dart';

part 'device.g.dart';

@JsonSerializable()
class Device {
  final String id;
  final String code;            // e.g., "VS-92026"
  final String userId;
  final String name;
  final String? firmwareVersion;
  final String? hardwareName;
  final bool paired;
  final bool online;
  final int batteryPct;
  final DateTime lastSync;
  final DateTime createdAt;
  final String? pairingPin;    // Temporary, for pairing screen
  
  Device({
    required this.id,
    required this.code,
    required this.userId,
    required this.name,
    this.firmwareVersion,
    this.hardwareName,
    required this.paired,
    required this.online,
    required this.batteryPct,
    required this.lastSync,
    required this.createdAt,
    this.pairingPin,
  });

  factory Device.fromJson(Map<String, dynamic> json) => _$DeviceFromJson(json);
  Map<String, dynamic> toJson() => _$DeviceToJson(this);

  // Helper to get device status
  String get status {
    if (!paired) return 'Unpaired';
    if (!online) return 'Offline';
    if (batteryPct < 10) return 'Low battery';
    return 'Connected';
  }

  // Helper to get status color
  int get statusColor {
    if (!paired) return 0xFFFFDC50; // Warning
    if (!online) return 0xFF7D89A8; // Offline
    if (batteryPct < 10) return 0xFFFF5068; // Error
    return 0xFF50FF96; // Online
  }
}

@JsonSerializable()
class MeasurementTrial {
  final int trialNumber;
  final double reading;
  final DateTime recordedAt;
  final int duration; // milliseconds

  MeasurementTrial({
    required this.trialNumber,
    required this.reading,
    required this.recordedAt,
    required this.duration,
  });

  factory MeasurementTrial.fromJson(Map<String, dynamic> json) =>
      _$MeasurementTrialFromJson(json);
  Map<String, dynamic> toJson() => _$MeasurementTrialToJson(this);
}

@JsonSerializable()
class Measurement {
  final String id;
  final String deviceId;
  final String assessmentId;
  final String hand;           // 'L' or 'R'
  final String posture;        // 'sitting' or 'standing'
  final List<MeasurementTrial> trials;
  final double peakReading;
  final double averageReading;
  final DateTime recordedAt;
  final DateTime createdAt;
  final String? notes;

  Measurement({
    required this.id,
    required this.deviceId,
    required this.assessmentId,
    required this.hand,
    required this.posture,
    required this.trials,
    required this.peakReading,
    required this.averageReading,
    required this.recordedAt,
    required this.createdAt,
    this.notes,
  });

  factory Measurement.fromJson(Map<String, dynamic> json) =>
      _$MeasurementFromJson(json);
  Map<String, dynamic> toJson() => _$MeasurementToJson(this);

  // Helper to get hand display name
  String get handDisplay => hand == 'L' ? 'Left' : 'Right';

  // Helper to get posture display name
  String get postureDisplay => posture.replaceFirst(
    posture[0],
    posture[0].toUpperCase(),
  );
}

@JsonSerializable()
class Assessment {
  final String id;
  final String deviceId;
  final String userId;
  final DateTime startedAt;
  final DateTime? completedAt;
  final String status;         // 'in_progress', 'completed'
  final List<String> measurementIds;

  Assessment({
    required this.id,
    required this.deviceId,
    required this.userId,
    required this.startedAt,
    this.completedAt,
    required this.status,
    required this.measurementIds,
  });

  factory Assessment.fromJson(Map<String, dynamic> json) =>
      _$AssessmentFromJson(json);
  Map<String, dynamic> toJson() => _$AssessmentToJson(this);
}

@JsonSerializable()
class Insight {
  final String id;
  final String assessmentId;
  final int severity;          // 0-3
  final String title;
  final String description;
  final String recommendation;
  final double? asymmetry;     // L-R difference percentage
  final double? trend;         // 1-week trend
  final DateTime generatedAt;

  Insight({
    required this.id,
    required this.assessmentId,
    required this.severity,
    required this.title,
    required this.description,
    required this.recommendation,
    this.asymmetry,
    this.trend,
    required this.generatedAt,
  });

  factory Insight.fromJson(Map<String, dynamic> json) =>
      _$InsightFromJson(json);
  Map<String, dynamic> toJson() => _$InsightToJson(this);

  // Helper to get severity color
  int get severityColor {
    switch (severity) {
      case 0:
        return 0xFF50FF96; // Green
      case 1:
        return 0xFFFFDC50; // Yellow
      case 2:
        return 0xFFFF8A00; // Orange
      case 3:
        return 0xFFFF5068; // Red
      default:
        return 0xFF7D89A8;
    }
  }

  String get severityLabel {
    switch (severity) {
      case 0:
        return 'Normal';
      case 1:
        return 'Mild';
      case 2:
        return 'Moderate';
      case 3:
        return 'Severe';
      default:
        return 'Unknown';
    }
  }
}
