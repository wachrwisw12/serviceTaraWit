import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

// Numeric keypad widget for PIN / password entry
class NumericKeypad extends StatelessWidget {
  const NumericKeypad({
    super.key,
    required this.onKeyPressed,
    this.onDelete,
    this.onSubmit,
    this.submitLabel,
    this.showSubmit = false,
  });

  final ValueChanged<String> onKeyPressed;
  final VoidCallback? onDelete;
  final VoidCallback? onSubmit;
  final String? submitLabel;
  final bool showSubmit;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        _buildRow(['1', '2', '3'], cs),
        _buildRow(['4', '5', '6'], cs),
        _buildRow(['7', '8', '9'], cs),
        Row(
          children: [
            if (showSubmit)
              _KeyButton(
                label: submitLabel ?? 'OK',
                isText: true,
                color: cs.primary,
                textColor: cs.onPrimary,
                onTap: onSubmit,
              )
            else
              const _KeyButton(label: '', isEnabled: false),
            _KeyButton(label: '0', onTap: () => _press('0')),
            _KeyButton(
              icon: Icons.backspace_outlined,
              onTap: onDelete,
            ),
          ],
        ),
      ],
    );
  }

  Row _buildRow(List<String> digits, ColorScheme cs) {
    return Row(
      children: digits.map((d) => _KeyButton(
        label: d,
        onTap: () => _press(d),
      )).toList(),
    );
  }

  void _press(String digit) {
    HapticFeedback.lightImpact();
    onKeyPressed(digit);
  }
}

class _KeyButton extends StatelessWidget {
  const _KeyButton({
    this.label,
    this.icon,
    this.onTap,
    this.isText = false,
    this.color,
    this.textColor,
    this.isEnabled = true,
  });

  final String? label;
  final IconData? icon;
  final VoidCallback? onTap;
  final bool isText;
  final Color? color;
  final Color? textColor;
  final bool isEnabled;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Expanded(
      child: Padding(
        padding: const EdgeInsets.all(4),
        child: SizedBox(
          height: 64,
          child: isEnabled
              ? Material(
                  color: color ?? cs.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(16),
                  child: InkWell(
                    onTap: onTap,
                    borderRadius: BorderRadius.circular(16),
                    child: Center(
                      child: icon != null
                          ? Icon(icon, size: 24, color: textColor ?? cs.onSurface)
                          : Text(
                              label ?? '',
                              style: TextStyle(
                                fontSize: isText ? 16 : 28,
                                fontWeight: isText ? FontWeight.w600 : FontWeight.w400,
                                color: textColor ?? cs.onSurface,
                              ),
                            ),
                    ),
                  ),
                )
              : const SizedBox.expand(),
        ),
      ),
    );
  }
}

// PIN dots display
class PinDisplay extends StatelessWidget {
  const PinDisplay({
    super.key,
    required this.length,
    required this.filledLength,
    this.error = false,
  });

  final int length;
  final int filledLength;
  final bool error;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(length, (i) {
        final filled = i < filledLength;
        return Container(
          width: 16,
          height: 16,
          margin: const EdgeInsets.symmetric(horizontal: 8),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: error
                ? cs.error
                : filled
                    ? cs.primary
                    : cs.outlineVariant,
          ),
        );
      }),
    );
  }
}

// PIN display with visible numbers
class PinDisplayText extends StatelessWidget {
  const PinDisplayText({
    super.key,
    required this.pin,
    this.length = 6,
    this.error = false,
  });

  final String pin;
  final int length;
  final bool error;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(length, (i) {
        final filled = i < pin.length;
        final char = filled ? pin[i] : '';

        return Container(
          width: 48,
          height: 56,
          margin: const EdgeInsets.symmetric(horizontal: 4),
          decoration: BoxDecoration(
            color: filled ? cs.primary.withValues(alpha: 0.1) : cs.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: error
                  ? cs.error
                  : filled
                      ? cs.primary
                      : cs.outlineVariant,
              width: filled ? 2 : 1,
            ),
          ),
          child: Center(
            child: Text(
              char,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: filled ? cs.primary : cs.outline,
              ),
            ),
          ),
        );
      }),
    );
  }
}
