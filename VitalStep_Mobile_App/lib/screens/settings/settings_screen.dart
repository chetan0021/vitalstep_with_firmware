import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../main.dart';
import '../../theme/colors.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _notificationsEnabled = true;
  bool _autoSync = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: VSColors.background,
      appBar: AppBar(title: const Text('Settings')),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Account section
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                'Account',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: VSColors.textSecondary,
                    ),
              ),
            ),
            ListTile(
              title: const Text('Profile'),
              leading: const Icon(Icons.person),
              onTap: () {},
            ),
            ListTile(
              title: const Text('Password'),
              leading: const Icon(Icons.lock),
              onTap: () {},
            ),
            const Divider(color: VSColors.border),
            // Preferences section
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                'Preferences',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: VSColors.textSecondary,
                    ),
              ),
            ),
            SwitchListTile(
              title: const Text('Notifications'),
              value: _notificationsEnabled,
              onChanged: (value) {
                setState(() => _notificationsEnabled = value);
              },
            ),
            SwitchListTile(
              title: const Text('Auto Sync'),
              value: _autoSync,
              onChanged: (value) {
                setState(() => _autoSync = value);
              },
            ),
            const Divider(color: VSColors.border),
            // About section
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                'About',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: VSColors.textSecondary,
                    ),
              ),
            ),
            ListTile(
              title: const Text('App Version'),
              subtitle: const Text('1.0.0'),
              leading: const Icon(Icons.info),
            ),
            ListTile(
              title: const Text('Privacy Policy'),
              leading: const Icon(Icons.privacy_tip),
              onTap: () {},
            ),
            ListTile(
              title: const Text('Terms of Service'),
              leading: const Icon(Icons.description),
              onTap: () {},
            ),
            const Divider(color: VSColors.border),
            // Sign out
            Padding(
              padding: const EdgeInsets.all(16),
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: VSColors.error,
                ),
                onPressed: () {
                  _showSignOutDialog(context);
                },
                child: const Text('Sign Out'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showSignOutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Sign Out?'),
        content: const Text('You will be signed out of your account.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              await context.read<AuthProvider>().signOut();
              // ignore: use_build_context_synchronously
              Navigator.of(context).pushReplacementNamed('/login');
            },
            child: const Text(
              'Sign Out',
              style: TextStyle(color: VSColors.error),
            ),
          ),
        ],
      ),
    );
  }
}
