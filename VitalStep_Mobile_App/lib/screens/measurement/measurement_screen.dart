import 'package:flutter/material.dart';
import '../../theme/colors.dart';

class MeasurementScreen extends StatefulWidget {
  const MeasurementScreen({Key? key}) : super(key: key);

  @override
  State<MeasurementScreen> createState() => _MeasurementScreenState();
}

class _MeasurementScreenState extends State<MeasurementScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: VSColors.background,
      appBar: AppBar(title: const Text('Start Test')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.pulse_checker,
              size: 80,
              color: VSColors.primary,
            ),
            const SizedBox(height: 24),
            Text(
              'Measurement Testing',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 12),
            Text(
              'This feature guides you through a complete palm pressure test',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: VSColors.textSecondary,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 48),
            Column(
              children: [
                _Step(
                  number: 1,
                  title: 'Select Hand',
                  subtitle: 'Choose left or right hand',
                ),
                const SizedBox(height: 16),
                _Step(
                  number: 2,
                  title: 'Select Posture',
                  subtitle: 'Sitting or standing',
                ),
                const SizedBox(height: 16),
                _Step(
                  number: 3,
                  title: 'Perform Test',
                  subtitle: 'Apply pressure 3 times',
                ),
                const SizedBox(height: 16),
                _Step(
                  number: 4,
                  title: 'View Results',
                  subtitle: 'See your measurements',
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _Step extends StatelessWidget {
  final int number;
  final String title;
  final String subtitle;

  const _Step({
    required this.number,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      decoration: BoxDecoration(
        color: VSColors.surfaceVariant,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: VSColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: VSColors.primaryGradient,
            ),
            child: Center(
              child: Text(
                '$number',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.labelLarge,
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: VSColors.textSecondary,
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
