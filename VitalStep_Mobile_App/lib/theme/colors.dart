import 'package:flutter/material.dart';

/// VitalStep Color Palette - Vibrant & Professional
class VSColors {
  // Primary gradient
  static const Color primary = Color(0xFF1E90FF);      // Dodger blue
  static const Color primaryDark = Color(0xFF0052CC);
  static const Color primaryLight = Color(0xFF42A5F5);

  // Secondary/Accent colors
  static const Color accent = Color(0xFFC870FF);       // Vibrant purple
  static const Color accentLight = Color(0xFFE0B8FF);
  static const Color accentDark = Color(0xFF9F3FD6);

  // Success/Warning/Error
  static const Color success = Color(0xFF50FF96);      // Vibrant green
  static const Color successDark = Color(0xFF22DC65);
  static const Color warning = Color(0xFFFFDC50);      // Vibrant gold
  static const Color error = Color(0xFFFF5068);        // Vibrant red
  static const Color errorLight = Color(0xFFFF8A9B);

  // Hand-specific colors (enhanced vibrant)
  static const Color leftHand = Color(0xFF00E6C8);     // Vibrant teal
  static const Color rightHand = Color(0xFFB464FF);    // Vibrant purple

  // Background & Surfaces
  static const Color background = Color(0xFF0A0F23);   // Deep blue-black
  static const Color surface = Color(0xFF161D3D);      // Slightly lighter
  static const Color surfaceVariant = Color(0xFF212D52);
  static const Color surfaceHigh = Color(0xFF2A3A6F);

  // Text colors
  static const Color textPrimary = Color(0xFFF8FAFE);
  static const Color textSecondary = Color(0xFFA5B4D2);
  static const Color textTertiary = Color(0xFF6E7D9F);
  static const Color textDisabled = Color(0xFF4A5577);

  // Border & Divider
  static const Color border = Color(0xFF3A4A6F);
  static const Color divider = Color(0xFF2A3A5F);

  // Status indicators
  static const Color online = Color(0xFF50FF96);
  static const Color offline = Color(0xFF7D89A8);
  static const Color syncing = Color(0xFFFFDC50);

  // Gradients
  static final LinearGradient primaryGradient = LinearGradient(
    colors: [primary, primaryDark],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static final LinearGradient accentGradient = LinearGradient(
    colors: [accent, accentDark],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static final LinearGradient backgroundGradient = LinearGradient(
    colors: [background, surface],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static final LinearGradient successGradient = LinearGradient(
    colors: [success, successDark],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static final LinearGradient warningGradient = LinearGradient(
    colors: [warning, Color(0xFFFFA500)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Enhanced gradient for cards
  static final LinearGradient cardGradient = LinearGradient(
    colors: [Color(0xFF1F2D4D), Color(0xFF2A3A6F)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Data visualization colors
  static const List<Color> chartColors = [
    Color(0xFF1E90FF),    // Blue
    Color(0xFFC870FF),    // Purple
    Color(0xFF00E6C8),    // Teal
    Color(0xFFFFDC50),    // Gold
    Color(0xFFFF5068),    // Red
  ];
}
