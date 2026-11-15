import 'package:flutter/material.dart';

// ─── VITALSTEP v2 — SUPABASE EDITION ────────────────────────────────────────
// Teal + Coral palette to visually distinguish from Digital Ocean version.

// Primary — Deep Teal
const Color kcPrimaryColor     = Color(0xFF00897B); // Teal 600
const Color kcPrimaryColorDark = Color(0xFF004D40); // Teal 900
const Color kcPrimaryColorLight= Color(0xFF4DB6AC); // Teal 300

// Accent — Coral (new, identifies this version)
const Color kcCoralColor       = Color(0xFFFF6B6B); // Coral / soft red
const Color kcCoralDark        = Color(0xFFE53935); // deeper coral
const Color kcCoralLight       = Color(0xFFFF8A80); // light coral

// Secondary — Medical Blue (kept from v1)
const Color kcSecondaryColor   = Color(0xFF1976D2);

// Accent Mint
const Color kcAccentColor      = Color(0xFF00BFA5);

// Semantic
const Color kcSuccessColor     = Color(0xFF4CAF50);
const Color kcWarningColor     = Color(0xFFFFB300);
const Color kcErrorColor       = Color(0xFFFF6B6B); // coral for errors
const Color kcInfoColor        = Color(0xFF2196F3);

// Neutral
const Color kcDarkGreyColor    = Color(0xFF1A1A1A);
const Color kcMediumGrey       = Color(0xFF757575);
const Color kcLightGrey        = Color(0xFFE0E0E0);
const Color kcVeryLightGrey    = Color(0xFFF5F7FA);
const Color kcBackgroundColor  = Color(0xFFF8FFFE); // very faint teal tint
const Color kcWhite            = Color(0xFFFFFFFF);

// Gradients
const LinearGradient kcPrimaryGradient = LinearGradient(
  colors: [kcPrimaryColor, kcPrimaryColorDark],
  begin: Alignment.topLeft,
  end: Alignment.bottomRight,
);

const LinearGradient kcCoralGradient = LinearGradient(
  colors: [kcCoralColor, kcCoralDark],
  begin: Alignment.topLeft,
  end: Alignment.bottomRight,
);

const LinearGradient kcHeroGradient = LinearGradient(
  colors: [Color(0xFF004D40), Color(0xFF00897B), Color(0xFF00BFA5)],
  begin: Alignment.topLeft,
  end: Alignment.bottomRight,
);

BoxShadow premiumShadow = BoxShadow(
  color: const Color(0xFF00897B).withOpacity(0.12),
  blurRadius: 24,
  offset: const Offset(0, 12),
);

BoxDecoration glassDecoration = BoxDecoration(
  color: Colors.white.withOpacity(0.12),
  borderRadius: BorderRadius.circular(30),
  border: Border.all(color: Colors.white.withOpacity(0.2), width: 1.5),
);
