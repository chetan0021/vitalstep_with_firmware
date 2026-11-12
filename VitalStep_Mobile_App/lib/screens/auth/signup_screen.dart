import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../../theme/colors.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({Key? key}) : super(key: key);

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _isLoading = false;
  String? _error;
  bool _agreeToTerms = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: VSColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Center(
                child: Column(
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: VSColors.accentGradient,
                      ),
                      child: const Icon(
                        Icons.person_add,
                        size: 40,
                        color: Colors.white,
                      ),
                    )
                        .animate()
                        .fadeIn(duration: 400.ms)
                        .scale(duration: 400.ms),
                    const SizedBox(height: 24),
                    Text(
                      'Join VitalStep',
                      style: Theme.of(context).textTheme.displaySmall?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    )
                        .animate()
                        .fadeIn(duration: 400.ms, delay: 100.ms),
                    const SizedBox(height: 8),
                    Text(
                      'Create your account to get started',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: VSColors.textSecondary,
                          ),
                    )
                        .animate()
                        .fadeIn(duration: 400.ms, delay: 200.ms),
                  ],
                ),
              ),
              const SizedBox(height: 48),

              // Error message
              if (_error != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: VSColors.error.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: VSColors.error),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: VSColors.error),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _error!,
                          style: const TextStyle(color: VSColors.error),
                        ),
                      ),
                    ],
                  ),
                )
                    .animate()
                    .slideX()
                    .fadeIn(),

              if (_error != null) const SizedBox(height: 24),

              // Email field
              TextField(
                controller: _emailController,
                decoration: InputDecoration(
                  hintText: 'Enter your email',
                  prefixIcon: const Icon(Icons.email_outlined),
                  enabled: !_isLoading,
                ),
                keyboardType: TextInputType.emailAddress,
              )
                  .animate()
                  .fadeIn(duration: 400.ms, delay: 300.ms)
                  .slideX(begin: -0.2, end: 0),
              const SizedBox(height: 16),

              // Password field
              TextField(
                controller: _passwordController,
                decoration: InputDecoration(
                  hintText: 'Create a password',
                  prefixIcon: const Icon(Icons.lock_outlined),
                  enabled: !_isLoading,
                ),
                obscureText: true,
              )
                  .animate()
                  .fadeIn(duration: 400.ms, delay: 400.ms)
                  .slideX(begin: -0.2, end: 0),
              const SizedBox(height: 16),

              // Confirm password field
              TextField(
                controller: _confirmPasswordController,
                decoration: InputDecoration(
                  hintText: 'Confirm your password',
                  prefixIcon: const Icon(Icons.lock_outlined),
                  enabled: !_isLoading,
                ),
                obscureText: true,
              )
                  .animate()
                  .fadeIn(duration: 400.ms, delay: 500.ms)
                  .slideX(begin: -0.2, end: 0),
              const SizedBox(height: 24),

              // Terms checkbox
              CheckboxListTile(
                value: _agreeToTerms,
                onChanged: _isLoading ? null : (value) {
                  setState(() => _agreeToTerms = value ?? false);
                },
                title: RichText(
                  text: TextSpan(
                    text: 'I agree to the ',
                    style: Theme.of(context).textTheme.bodySmall,
                    children: [
                      TextSpan(
                        text: 'Terms of Service',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: VSColors.primary,
                              fontWeight: FontWeight.w600,
                            ),
                      ),
                    ],
                  ),
                ),
                contentPadding: EdgeInsets.zero,
              )
                  .animate()
                  .fadeIn(duration: 400.ms, delay: 600.ms),
              const SizedBox(height: 32),

              // Sign up button
              ElevatedButton(
                onPressed: (_isLoading || !_agreeToTerms) ? null : _signUp,
                child: _isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Text('Create Account'),
              )
                  .animate()
                  .fadeIn(duration: 400.ms, delay: 700.ms)
                  .slideY(begin: 0.2, end: 0),
              const SizedBox(height: 16),

              // Sign in link
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Already have an account? ',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  TextButton(
                    onPressed: _isLoading
                        ? null
                        : () {
                            Navigator.of(context).pushReplacementNamed('/login');
                          },
                    child: const Text(
                      'Sign In',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        color: VSColors.accent,
                      ),
                    ),
                  ),
                ],
              )
                  .animate()
                  .fadeIn(duration: 400.ms, delay: 800.ms),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _signUp() async {
    if (_passwordController.text != _confirmPasswordController.text) {
      setState(() {
        _error = 'Passwords do not match';
      });
      return;
    }

    setState(() {
      _error = null;
      _isLoading = true;
    });

    try {
      // ignore: use_build_context_synchronously
      await context.read<AuthProvider>().signUp(
            _emailController.text.trim(),
            _passwordController.text,
          );
      // ignore: use_build_context_synchronously
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Account created! Please sign in.')),
        );
        Navigator.of(context).pushReplacementNamed('/login');
      }
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }
}
