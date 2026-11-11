import 'package:flutter/material.dart';
import '../../theme/colors.dart';

class HistoryScreen extends StatelessWidget {
  const HistoryScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: VSColors.background,
      appBar: AppBar(title: const Text('Measurement History')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.history,
              size: 80,
              color: VSColors.accent,
            ),
            const SizedBox(height: 24),
            Text(
              'Your Measurement History',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 12),
            Text(
              'View all your palm pressure measurements in one place',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: VSColors.textSecondary,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 48),
            ElevatedButton(
              onPressed: () {},
              style: ElevatedButton.styleFrom(
                backgroundColor: VSColors.accent,
              ),
              child: const Text('Go to Home'),
            ),
          ],
        ),
      ),
    );
  }
}
