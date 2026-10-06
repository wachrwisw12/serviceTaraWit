import 'dart:async';

import 'package:flutter/material.dart';

import '../../shared/skeleton_loader.dart';
import 'attendance_controller.dart';
import 'attendance_map_card.dart';
import 'attendance_models.dart';

class AttendancePage extends StatefulWidget {
  const AttendancePage({super.key});

  @override
  State<AttendancePage> createState() => _AttendancePageState();
}

class _AttendancePageState extends State<AttendancePage> {
  final _controller = AttendanceController();
  late final Timer _clockTimer;
  DateTime _now = DateTime.now();

  @override
  void initState() {
    super.initState();
    _controller.load();
    _clockTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _now = DateTime.now());
    });
  }

  @override
  void dispose() {
    _clockTimer.cancel();
    _controller.dispose();
    super.dispose();
  }

  Future<void> _confirmAttendance({required bool checkIn}) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        icon: Icon(checkIn ? Icons.login_rounded : Icons.logout_rounded),
        title: Text(checkIn ? 'ยืนยันลงเวลาเข้างาน' : 'ยืนยันลงเวลาออกงาน'),
        content: Text(
          'ระบบจะบันทึกเวลา ${_formatClock(DateTime.now())} น.\n\n${_controller.locationStatus}'
          '${_controller.nearestDistanceM == null ? '' : '\nห่างจากจุดลงเวลาใกล้ที่สุด ${_controller.nearestDistanceM!.round()} เมตร'}',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('ยกเลิก')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('ยืนยัน')),
        ],
      ),
    );
    if (confirmed != true) return;

    final success = checkIn ? await _controller.checkIn() : await _controller.checkOut();
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(success
            ? checkIn ? 'ลงเวลาเข้างานเรียบร้อยแล้ว' : 'ลงเวลาออกงานเรียบร้อยแล้ว'
            : _controller.errorMessage ?? 'ดำเนินการไม่สำเร็จ'),
        backgroundColor: success ? const Color(0xFF0F8A6A) : Theme.of(context).colorScheme.error,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) => Scaffold(
        appBar: AppBar(title: const Text('ลงเวลาของฉัน')),
        body: RefreshIndicator(
          onRefresh: _controller.load,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
            children: [
              if (_controller.errorMessage != null) ...[
                _ErrorBanner(message: _controller.errorMessage!),
                const SizedBox(height: 12),
              ],
              _ClockCard(
                now: _now,
                controller: _controller,
                onCheckIn: () => _confirmAttendance(checkIn: true),
                onCheckOut: () => _confirmAttendance(checkIn: false),
              ),
              const SizedBox(height: 16),
              AttendanceMapCard(controller: _controller),
              const SizedBox(height: 16),
              _TodayCard(controller: _controller),
              const SizedBox(height: 24),
              _MonthHeader(controller: _controller),
              const SizedBox(height: 12),
              _SummaryGrid(summary: _controller.summary),
              const SizedBox(height: 16),
              _HistoryCard(controller: _controller),
            ],
          ),
        ),
      ),
    );
  }
}

class _ClockCard extends StatelessWidget {
  const _ClockCard({required this.now, required this.controller, required this.onCheckIn, required this.onCheckOut});

  final DateTime now;
  final AttendanceController controller;
  final VoidCallback onCheckIn;
  final VoidCallback onCheckOut;

  @override
  Widget build(BuildContext context) {
    final hasIn = controller.hasCheckedIn;
    final hasOut = controller.hasCheckedOut;
    final message = hasOut
        ? 'ลงเวลาออกงานแล้ว วันนี้ครบถ้วนแล้ว'
        : hasIn
            ? 'ลงเวลาเข้างานแล้ว อย่าลืมลงเวลาออก'
            : 'ยังไม่ได้ลงเวลาวันนี้';

    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [Color(0xFF102A43), Color(0xFF245B8F)], begin: Alignment.topLeft, end: Alignment.bottomRight),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(children: [
        Text(_formatThaiDate(now), textAlign: TextAlign.center, style: const TextStyle(color: Colors.white70)),
        const SizedBox(height: 8),
        Text(_formatClock(now, seconds: true), style: const TextStyle(color: Colors.white, fontSize: 43, fontWeight: FontWeight.bold, fontFeatures: [FontFeature.tabularFigures()])),
        const SizedBox(height: 6),
        Text(message, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white70, fontSize: 13)),
        const SizedBox(height: 22),
        if (controller.isLoadingToday)
          const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5))
        else
          Row(children: [
            Expanded(child: FilledButton.icon(
              onPressed: hasIn || controller.isSubmitting || !controller.canCheckInNow ? null : onCheckIn,
              style: FilledButton.styleFrom(backgroundColor: const Color(0xFF0F8A6A), foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 14)),
              icon: const Icon(Icons.login_rounded),
              label: const Text('เข้างาน'),
            )),
            const SizedBox(width: 10),
            Expanded(child: FilledButton.icon(
              onPressed: !hasIn || hasOut || controller.isSubmitting || !controller.canCheckOutNow ? null : onCheckOut,
              style: FilledButton.styleFrom(backgroundColor: Colors.white, foregroundColor: const Color(0xFF102A43), disabledBackgroundColor: Colors.white24, padding: const EdgeInsets.symmetric(vertical: 14)),
              icon: const Icon(Icons.logout_rounded),
              label: const Text('ออกงาน'),
            )),
          ]),
        if (controller.isSubmitting) ...[
          const SizedBox(height: 14),
          const LinearProgressIndicator(color: Color(0xFF8CE0C7), backgroundColor: Colors.white24),
        ],
      ]),
    );
  }
}

class _TodayCard extends StatelessWidget {
  const _TodayCard({required this.controller});
  final AttendanceController controller;

  @override
  Widget build(BuildContext context) {
    final record = controller.today;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Row(children: [Icon(Icons.today_outlined, size: 20), SizedBox(width: 8), Text('บันทึกวันนี้', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16))]),
          const SizedBox(height: 16),
          if (controller.isLoadingToday)
            const Center(child: Padding(padding: EdgeInsets.all(16), child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))))
          else if (record == null)
            const Center(child: Padding(padding: EdgeInsets.all(16), child: Text('ยังไม่มีบันทึกการลงเวลาวันนี้', style: TextStyle(color: Colors.black54))))
          else
            Row(children: [
              Expanded(child: _TodayValue(label: 'เวลาเข้า', value: _formatTime(record.checkInAt), icon: Icons.login_rounded)),
              Expanded(child: _TodayValue(label: 'เวลาออก', value: _formatTime(record.checkOutAt), icon: Icons.logout_rounded)),
              Expanded(child: _TodayValue(label: 'เวลาทำงาน', value: _formatDuration(record.workMinutes), icon: Icons.timer_outlined)),
            ]),
        ]),
      ),
    );
  }
}

class _TodayValue extends StatelessWidget {
  const _TodayValue({required this.label, required this.value, required this.icon});
  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) => Column(children: [
        Icon(icon, size: 20, color: Theme.of(context).colorScheme.primary),
        const SizedBox(height: 6),
        Text(label, style: const TextStyle(fontSize: 11, color: Colors.black54)),
        const SizedBox(height: 3),
        Text(value, textAlign: TextAlign.center, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
      ]);
}

class _MonthHeader extends StatelessWidget {
  const _MonthHeader({required this.controller});
  final AttendanceController controller;

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final isCurrent = controller.selectedMonth.year == now.year && controller.selectedMonth.month == now.month;
    return Row(children: [
      Expanded(child: Text('ประวัติเดือน${_thaiMonths[controller.selectedMonth.month - 1]} ${controller.selectedMonth.year + 543}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 17))),
      IconButton(onPressed: controller.isLoadingRecords ? null : () => controller.changeMonth(-1), tooltip: 'เดือนก่อน', icon: const Icon(Icons.chevron_left)),
      IconButton(onPressed: isCurrent || controller.isLoadingRecords ? null : () => controller.changeMonth(1), tooltip: 'เดือนถัดไป', icon: const Icon(Icons.chevron_right)),
    ]);
  }
}

class _SummaryGrid extends StatelessWidget {
  const _SummaryGrid({required this.summary});
  final AttendanceSummary summary;

  @override
  Widget build(BuildContext context) {
    final items = [
      ('ทำงานอยู่', summary.working, const Color(0xFFF59E0B)),
      ('ตรงเวลา', summary.present, const Color(0xFF0F8A6A)),
      ('มาสาย', summary.late, const Color(0xFFF97316)),
      ('ออกก่อน', summary.earlyLeave, const Color(0xFF2563EB)),
    ];
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 4, crossAxisSpacing: 8, mainAxisExtent: 84),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        return Card(child: Padding(padding: const EdgeInsets.all(8), child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [Text('${item.$2}', style: TextStyle(fontSize: 21, fontWeight: FontWeight.bold, color: item.$3)), const SizedBox(height: 3), Text(item.$1, maxLines: 1, style: const TextStyle(fontSize: 10, color: Colors.black54))])));
      },
    );
  }
}

class _HistoryCard extends StatelessWidget {
  const _HistoryCard({required this.controller});
  final AttendanceController controller;

  @override
  Widget build(BuildContext context) {
    if (controller.isLoadingRecords) return const Padding(padding: EdgeInsets.all(16), child: AttendanceSkeleton());
    if (controller.records.isEmpty) return const Card(child: Padding(padding: EdgeInsets.all(28), child: Center(child: Text('ยังไม่มีประวัติในเดือนนี้', style: TextStyle(color: Colors.black54)))));
    return Card(
      clipBehavior: Clip.antiAlias,
      child: Column(children: [
        for (var index = 0; index < controller.records.length; index++) ...[
          _HistoryRow(record: controller.records[index]),
          if (index != controller.records.length - 1) const Divider(height: 1),
        ],
      ]),
    );
  }
}

class _HistoryRow extends StatelessWidget {
  const _HistoryRow({required this.record});
  final AttendanceRecord record;

  @override
  Widget build(BuildContext context) {
    final status = _statusInfo(record.status);
    return Padding(
      padding: const EdgeInsets.all(14),
      child: Row(children: [
        Container(width: 42, height: 42, alignment: Alignment.center, decoration: BoxDecoration(color: status.$2.withValues(alpha: .12), borderRadius: BorderRadius.circular(12)), child: Text(_day(record.recordDate), style: TextStyle(fontWeight: FontWeight.bold, color: status.$2))),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(_formatRecordDate(record.recordDate), style: const TextStyle(fontWeight: FontWeight.w600)), const SizedBox(height: 4), Text('${_formatTime(record.checkInAt)} – ${_formatTime(record.checkOutAt)}  •  ${_formatDuration(record.workMinutes)}', style: const TextStyle(fontSize: 12, color: Colors.black54))])),
        Container(padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5), decoration: BoxDecoration(color: status.$2.withValues(alpha: .1), borderRadius: BorderRadius.circular(20)), child: Text(status.$1, style: TextStyle(color: status.$2, fontSize: 11, fontWeight: FontWeight.w600))),
      ]),
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message});
  final String message;
  @override
  Widget build(BuildContext context) => Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: Theme.of(context).colorScheme.errorContainer, borderRadius: BorderRadius.circular(12)), child: Row(children: [Icon(Icons.error_outline, color: Theme.of(context).colorScheme.error), const SizedBox(width: 10), Expanded(child: Text(message))]));
}

const _thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const _thaiWeekdays = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];

String _formatClock(DateTime time, {bool seconds = false}) => '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}${seconds ? ':${time.second.toString().padLeft(2, '0')}' : ''}';
String _formatTime(DateTime? time) => time == null ? '-' : _formatClock(time);
String _formatThaiDate(DateTime date) => 'วัน${_thaiWeekdays[date.weekday - 1]}ที่ ${date.day} ${_thaiMonths[date.month - 1]} ${date.year + 543}';
String _formatDuration(int? minutes) => minutes == null ? '-' : minutes < 60 ? '$minutes นาที' : '${minutes ~/ 60} ชม. ${minutes % 60} นาที';
String _day(String date) => date.length >= 10 ? date.substring(8, 10) : '-';
String _formatRecordDate(String value) {
  final date = DateTime.tryParse(value);
  return date == null ? value : '${date.day} ${_thaiMonths[date.month - 1]} ${date.year + 543}';
}

(String, Color) _statusInfo(String status) => switch (status) {
      'present' => ('ตรงเวลา', const Color(0xFF0F8A6A)),
      'late' => ('มาสาย', const Color(0xFFF97316)),
      'early_leave' => ('ออกก่อนเวลา', const Color(0xFF2563EB)),
      _ => ('ทำงานอยู่', const Color(0xFFF59E0B)),
    };
