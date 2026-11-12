import 'package:flutter/material.dart';
import '../../theme/colors.dart';

class InsightsScreen extends StatelessWidget {
  const InsightsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: VSColors.background,
      appBar: AppBar(title: const Text('Health Insights')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.insights,
              size: 80,
              color: VSColors.warning,
            ),
            const SizedBox(height: 24),
            Text(
              'Your Health Insights',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 12),
            Text(
              'AI-powered analysis of your palm pressure data',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: VSColors.textSecondary,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 48),
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: VSColors.surfaceVariant,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: VSColors.border),
              ),
              child: Column(
                children: [
                  Text(
                    'Insights are generated',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'After you complete your first measurement, you\'ll receive personalized health insights.',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: VSColors.textSecondary,
                        ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
