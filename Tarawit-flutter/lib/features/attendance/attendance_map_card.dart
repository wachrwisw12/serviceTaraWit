import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import 'attendance_controller.dart';
import 'attendance_models.dart';

class AttendanceMapCard extends StatefulWidget {
  const AttendanceMapCard({super.key, required this.controller});

  final AttendanceController controller;

  @override
  State<AttendanceMapCard> createState() => _AttendanceMapCardState();
}

class _AttendanceMapCardState extends State<AttendanceMapCard> {
  final _mapController = MapController();
  bool _hasFocusedPosition = false;

  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_followFirstPosition);
    WidgetsBinding.instance.addPostFrameCallback((_) => _followFirstPosition());
  }

  void _followFirstPosition() {
    if (_hasFocusedPosition || !mounted || widget.controller.currentPosition == null) return;
    _hasFocusedPosition = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _focusCurrentPosition();
    });
  }

  @override
  void dispose() {
    widget.controller.removeListener(_followFirstPosition);
    super.dispose();
  }

  void _focusCurrentPosition() {
    final position = widget.controller.currentPosition;
    if (position != null) _mapController.move(LatLng(position.latitude, position.longitude), 17);
  }

  @override
  Widget build(BuildContext context) {
    final controller = widget.controller;
    final policy = controller.locationPolicy;
    final position = controller.currentPosition;
    final fallback = policy?.locations.isNotEmpty == true
        ? LatLng(policy!.locations.first.latitude, policy.locations.first.longitude)
        : const LatLng(13.7563, 100.5018);
    final center = position == null ? fallback : LatLng(position.latitude, position.longitude);
    final statusColor = controller.canPerformNextAttendance || controller.hasCheckedOut
        ? const Color(0xFF0F8A6A)
        : controller.isLoadingLocation || (policy?.enabled == true && position == null)
            ? const Color(0xFFF59E0B)
            : const Color(0xFFD14343);

    return Card(
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            height: 280,
            child: Stack(
              children: [
                FlutterMap(
                  mapController: _mapController,
                  options: MapOptions(initialCenter: center, initialZoom: 16),
                  children: [
                    TileLayer(
                      urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                      userAgentPackageName: 'th.ac.tarawit.tarawit_mobile',
                    ),
                    CircleLayer(
                      circles: [
                        for (final location in policy?.locations ?? const <AttendanceLocation>[])
                          CircleMarker(
                            point: LatLng(location.latitude, location.longitude),
                            radius: location.radiusM,
                            useRadiusInMeter: true,
                            color: const Color(0x3317A673),
                            borderColor: const Color(0xFF0F8A6A),
                            borderStrokeWidth: 2,
                          ),
                        if (position != null)
                          CircleMarker(
                            point: center,
                            radius: position.accuracy,
                            useRadiusInMeter: true,
                            color: const Color(0x222563EB),
                            borderColor: const Color(0x662563EB),
                            borderStrokeWidth: 1,
                          ),
                      ],
                    ),
                    MarkerLayer(
                      markers: [
                        for (final location in policy?.locations ?? const <AttendanceLocation>[])
                          Marker(
                            point: LatLng(location.latitude, location.longitude),
                            width: 44,
                            height: 44,
                            child: const Icon(Icons.location_on_rounded, color: Color(0xFF0F8A6A), size: 36),
                          ),
                        if (position != null)
                          Marker(
                            point: center,
                            width: 34,
                            height: 34,
                            child: Container(
                              decoration: BoxDecoration(
                                color: const Color(0xFF2563EB),
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.white, width: 4),
                                boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 8)],
                              ),
                            ),
                          ),
                      ],
                    ),
                    RichAttributionWidget(
                      attributions: const [TextSourceAttribution('OpenStreetMap contributors')],
                    ),
                  ],
                ),
                Positioned(
                  right: 12,
                  bottom: 12,
                  child: FloatingActionButton.small(
                    heroTag: 'attendance-map-location',
                    onPressed: position == null ? null : _focusCurrentPosition,
                    tooltip: 'ตำแหน่งของฉัน',
                    child: const Icon(Icons.my_location_rounded),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(width: 10, height: 10, decoration: BoxDecoration(color: statusColor, shape: BoxShape.circle)),
                    const SizedBox(width: 8),
                    Expanded(child: Text(controller.attendanceEligibilityStatus, style: TextStyle(color: statusColor, fontWeight: FontWeight.bold))),
                  ],
                ),
                if (controller.nearestLocation != null && controller.nearestDistanceM != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    'จุดใกล้ที่สุด: ${controller.nearestLocation!.name} • ห่าง ${_distance(controller.nearestDistanceM!)}',
                    style: const TextStyle(fontSize: 12, color: Colors.black54),
                  ),
                ],
                if (position != null) ...[
                  const SizedBox(height: 4),
                  Text('ความแม่นยำ GPS ±${position.accuracy.round()} เมตร', style: const TextStyle(fontSize: 12, color: Colors.black54)),
                ],
                if (controller.locationError != null) ...[
                  const SizedBox(height: 10),
                  OutlinedButton.icon(
                    onPressed: controller.startLocationTracking,
                    icon: const Icon(Icons.refresh_rounded),
                    label: const Text('ลองตรวจสอบตำแหน่งอีกครั้ง'),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

String _distance(double meters) => meters < 1000 ? '${meters.round()} ม.' : '${(meters / 1000).toStringAsFixed(1)} กม.';
