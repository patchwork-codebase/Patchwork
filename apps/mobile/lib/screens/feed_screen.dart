import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../widgets/feed_update_card.dart';
import '../widgets/empty_state.dart';
import '../widgets/skeleton_loaders.dart';
import 'create_update_screen.dart';
import 'notifications_screen.dart';
import 'public_profile_screen.dart';
import 'explore_screen.dart';

class FeedScreen extends StatefulWidget {
  const FeedScreen({super.key});

  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  final List<Map<String, dynamic>> _updates = [];
  bool _isLoading = true;
  bool _isLoadingMore = false;
  bool _hasMore = true;
  int _unreadNotifications = 0;
  
  List<Map<String, dynamic>> _suggestedBuilders = [];
  bool _isLoadingBuilders = true;
  final Set<String> _followingBuilders = {};
  
  final int _pageSize = 20;
  final ScrollController _scrollController = ScrollController();

  String _activeDomainFilter = 'All';
  String _activeViewToggle = 'All';
  
  int _newUpdatesCount = 0;
  RealtimeChannel? _updatesChannel;

  @override
  void initState() {
    super.initState();
    _fetchInitialFeed();
    _fetchSuggestedBuilders();
    _fetchFollowing();
    _fetchUnreadNotifications();
    _scrollController.addListener(_onScroll);
    
    _setupRealtimeUpdates();
  }

  void _setupRealtimeUpdates() {
    _updatesChannel = Supabase.instance.client
        .channel('public:updates')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'updates',
          callback: (payload) {
            final userId = Supabase.instance.client.auth.currentUser?.id;
            // Only show pill for other people's updates
            if (payload.newRecord['author_id'] != userId) {
              if (mounted) {
                setState(() {
                  _newUpdatesCount++;
                });
              }
            }
          },
        )
        .subscribe();
  }

  Future<void> _fetchUnreadNotifications() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;
    try {
      final res = await Supabase.instance.client
          .from('notifications')
          .select('id')
          .eq('user_id', userId)
          .eq('read', false);
      if (mounted) setState(() => _unreadNotifications = (res as List).length);
    } catch (_) {}
  }

  Future<void> _fetchFollowing() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;
    try {
      final res = await Supabase.instance.client
          .from('follows')
          .select('following_id')
          .eq('follower_id', userId);
      if (mounted) {
        setState(() {
          for (final row in res) {
            _followingBuilders.add(row['following_id']);
          }
        });
      }
    } catch (_) {}
  }

  Future<void> _fetchSuggestedBuilders() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    try {
      var query = Supabase.instance.client
          .from('users')
          .select('id, name, avatar, is_verified_expert');
          
      if (userId != null) {
        query = query.neq('id', userId);
      }
      
      final response = await query.limit(5);
      if (mounted) {
        setState(() {
          _suggestedBuilders = List<Map<String, dynamic>>.from(response);
          _isLoadingBuilders = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoadingBuilders = false);
    }
  }

  @override
  void dispose() {
    _updatesChannel?.unsubscribe();
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
      if (!_isLoadingMore && _hasMore) {
        _fetchMoreFeed();
      }
    }
  }

  SupabaseQueryBuilder get _updatesQuery => Supabase.instance.client.from('updates');

  PostgrestTransformBuilder<List<Map<String, dynamic>>> _buildBaseQuery() {
    // If we need to filter by a room tag, we MUST use an inner join.
    final selectString = _activeDomainFilter != 'All'
        ? '*, rooms!inner(title, tags), users(name, avatar, is_verified_expert, organization_name), original_update:repost_id(*, users(name, avatar, is_verified_expert))'
        : '*, rooms(title, tags), users(name, avatar, is_verified_expert, organization_name), original_update:repost_id(*, users(name, avatar, is_verified_expert))';

    var filterBuilder = Supabase.instance.client.from('updates').select(selectString);

    if (_activeDomainFilter != 'All') {
      // Assuming 'tags' is a text array
      filterBuilder = filterBuilder.contains('rooms.tags', [_activeDomainFilter.toLowerCase()]);
    }

    if (_activeViewToggle == 'Media') {
      filterBuilder = filterBuilder.not('media_url', 'is', null);
    } else if (_activeViewToggle == 'Launches') {
      // For launches, we'd ideally check rooms.update_count == 1, but we can't easily filter by joined counts without a view.
      // We'll fall back to ignoring for now.
    }

    return filterBuilder.order('created_at', ascending: false);
  }

  Future<void> _fetchInitialFeed() async {
    setState(() {
      _isLoading = true;
      _hasMore = true;
      _updates.clear();
    });

    try {
      final response = await _buildBaseQuery().range(0, _pageSize - 1);

      if (mounted) {
        setState(() {
          _updates.addAll(List<Map<String, dynamic>>.from(response));
          if (response.length < _pageSize) _hasMore = false;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _fetchMoreFeed() async {
    setState(() => _isLoadingMore = true);

    try {
      final startIndex = _updates.length;
      final response = await _buildBaseQuery().range(startIndex, startIndex + _pageSize - 1);

      if (mounted) {
        setState(() {
          _updates.addAll(List<Map<String, dynamic>>.from(response));
          if (response.length < _pageSize) _hasMore = false;
          _isLoadingMore = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoadingMore = false);
    }
  }

  void _onFilterChanged(String filter, bool isDomain) {
    setState(() {
      if (isDomain) {
        _activeDomainFilter = filter;
      } else {
        _activeViewToggle = filter;
      }
    });
    _fetchInitialFeed();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Subtle Background Glow
          Positioned(
            top: -150,
            left: 0,
            right: 0,
            child: Container(
              height: 400,
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  colors: [
                    context.themeColors.primary500.withOpacity(0.08),
                    Colors.transparent,
                  ],
                  radius: 0.8,
                ),
              ),
            ),
          ),
          CustomScrollView(
            controller: _scrollController,
            physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
            slivers: [
              CupertinoSliverRefreshControl(
                onRefresh: _fetchInitialFeed,
                builder: (context, refreshState, pulledExtent, refreshTriggerPullDistance, refreshIndicatorExtent) {
                  const curve = Curves.easeOutCubic;
                  final percentage = (pulledExtent / refreshTriggerPullDistance).clamp(0.0, 1.0);
                  
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.only(top: 16.0),
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: context.themeColors.surface,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.1),
                              blurRadius: 8,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Transform.rotate(
                          angle: percentage * 3.14159 * 2, // Full rotation
                          child: Icon(
                            LucideIcons.loader,
                            color: context.themeColors.primary500,
                            size: 20 + (percentage * 4), // Scales up slightly as you pull
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
              SliverAppBar(
                  floating: true,
                  snap: true,
                  pinned: false, // Let it scroll away gracefully to avoid RenderFlex infinite height errors
                  title: const Text('Global timeline', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
                  centerTitle: false,
                  backgroundColor: context.themeColors.background.withOpacity(0.85),
                  elevation: 0,
                  actions: [
                    Padding(
                      padding: const EdgeInsets.only(right: 16),
                      child: GestureDetector(
                        onTap: () {
                          Navigator.push(context, MaterialPageRoute(builder: (context) => const NotificationsScreen())).then((_) => _fetchUnreadNotifications());
                        },
                        child: Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: context.themeColors.surface,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: context.themeColors.borderSubtle),
                          ),
                          child: Stack(
                            alignment: Alignment.center,
                            children: [
                              Icon(LucideIcons.bell, size: 20, color: context.themeColors.textPrimary),
                              if (_unreadNotifications > 0)
                                Positioned(
                                  top: 10,
                                  right: 12,
                                  child: Container(
                                    width: 8,
                                    height: 8,
                                    decoration: const BoxDecoration(color: Colors.redAccent, shape: BoxShape.circle),
                                  ).animate(onPlay: (c) => c.repeat(reverse: true)).fade(begin: 0.5, end: 1),
                                ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                  bottom: PreferredSize(
                    preferredSize: const Size.fromHeight(56),
                    child: Container(
                      decoration: BoxDecoration(
                        border: Border(bottom: BorderSide(color: context.themeColors.borderSubtle)),
                      ),
                      child: SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: [
                            _buildDomainTab('All', _activeDomainFilter == 'All'),
                            _buildDomainTab('Product', _activeDomainFilter == 'Product'),
                            _buildDomainTab('Engineering', _activeDomainFilter == 'Engineering'),
                            _buildDomainTab('Design', _activeDomainFilter == 'Design'),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _buildViewToggle('All', _activeViewToggle == 'All'),
                          const SizedBox(width: 8),
                          _buildViewToggle('Media', _activeViewToggle == 'Media'),
                          const SizedBox(width: 8),
                          _buildViewToggle('Launches', _activeViewToggle == 'Launches'),
                        ],
                      ),
                    ),
                  ),
                ),
                if (_isLoading)
                  SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) => const FeedCardSkeleton(),
                      childCount: 5,
                    ),
                  )
                else if (_updates.isEmpty)
                  SliverFillRemaining(
                    child: EmptyState(
                      icon: LucideIcons.ghost,
                      title: 'Quiet out here...',
                      description: 'Check back later or follow more builders to populate your feed.',
                      buttonText: 'Find Builders',
                      onButtonTap: () {
                        Navigator.push(context, MaterialPageRoute(builder: (c) => const ExploreScreen()));
                      },
                    ),
                  )
                else
                  SliverPadding(
                    padding: const EdgeInsets.only(bottom: 100),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final bool showSuggested = _suggestedBuilders.isNotEmpty;
                          final int suggestedIndex = 3; 

                          final int loadingIndicatorIndex = _updates.length + (showSuggested && _updates.length >= suggestedIndex ? 1 : 0);

                          if (index == loadingIndicatorIndex) {
                            return Padding(
                              padding: const EdgeInsets.symmetric(vertical: 24),
                              child: Center(child: CircularProgressIndicator(color: context.themeColors.primary500)),
                            );
                          }

                          if (showSuggested && _updates.length >= suggestedIndex) {
                            if (index == suggestedIndex) {
                              return _buildInlineSuggestedBuilders();
                            }
                            if (index > suggestedIndex) {
                              return FeedUpdateCard(
                                update: _updates[index - 1],
                                onRefresh: _fetchInitialFeed,
                              );
                            }
                          }
                          return FeedUpdateCard(
                            update: _updates[index],
                            onRefresh: _fetchInitialFeed,
                          );
                        },
                        childCount: _updates.length + (_isLoadingMore ? 1 : 0) + (_suggestedBuilders.isNotEmpty && _updates.length >= 3 ? 1 : 0),
                      ),
                    ),
                  ),
              ],
            ),
          
          // Dynamic New Updates Pill
          Positioned(
            top: MediaQuery.of(context).padding.top + 16,
            left: 0,
            right: 0,
            child: AnimatedSlide(
              offset: _newUpdatesCount > 0 ? Offset.zero : const Offset(0, -2),
              duration: const Duration(milliseconds: 400),
              curve: Curves.easeOutBack,
              child: AnimatedOpacity(
                opacity: _newUpdatesCount > 0 ? 1.0 : 0.0,
                duration: const Duration(milliseconds: 300),
                child: Center(
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: () {
                        HapticFeedback.lightImpact();
                        _scrollController.animateTo(
                          0,
                          duration: const Duration(milliseconds: 500),
                          curve: Curves.easeOutCubic,
                        );
                        _fetchInitialFeed();
                        setState(() {
                          _newUpdatesCount = 0;
                        });
                      },
                      borderRadius: BorderRadius.circular(30),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          color: context.themeColors.primary500,
                          borderRadius: BorderRadius.circular(30),
                          boxShadow: [
                            BoxShadow(
                              color: context.themeColors.primary500.withOpacity(0.3),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(LucideIcons.arrowUp, color: Colors.white, size: 16),
                            const SizedBox(width: 6),
                            Text(
                              '$_newUpdatesCount New update${_newUpdatesCount == 1 ? '' : 's'}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
      floatingActionButton: Padding(
        padding: const EdgeInsets.only(bottom: 72.0),
        child: FloatingActionButton(
          onPressed: () {
            Navigator.of(context).push(
              MaterialPageRoute(builder: (context) => const CreateUpdateScreen()),
            ).then((_) {
              _fetchInitialFeed();
            });
          },
          backgroundColor: context.themeColors.primary500,
          foregroundColor: Colors.white,
          child: const Icon(LucideIcons.plus),
        ),
      ),
    );
  }

  Widget _buildDomainTab(String label, bool isActive) {
    return GestureDetector(
      onTap: () => _onFilterChanged(label, true),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(
              color: isActive ? context.themeColors.primary500 : Colors.transparent,
              width: 3,
            ),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 15,
            fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
            color: isActive ? context.themeColors.textPrimary : context.themeColors.textSecondary,
          ),
        ),
      ),
    );
  }

  Widget _buildViewToggle(String label, bool isActive) {
    return GestureDetector(
      onTap: () => _onFilterChanged(label, false),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: isActive ? context.themeColors.textPrimary.withOpacity(0.08) : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isActive ? context.themeColors.textPrimary.withOpacity(0.2) : context.themeColors.borderSubtle),
        ),
        child: Text(
          label.toUpperCase(),
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.bold,
            color: isActive ? context.themeColors.textPrimary : context.themeColors.textSecondary,
            letterSpacing: 1.0,
          ),
        ),
      ),
    );
  }

  Widget _buildInlineSuggestedBuilders() {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      padding: const EdgeInsets.symmetric(vertical: 20),
      decoration: BoxDecoration(
        color: context.themeColors.surfaceHighlight.withOpacity(0.3),
        border: Border.symmetric(horizontal: BorderSide(color: context.themeColors.borderSubtle)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('People to follow', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: context.themeColors.textPrimary)),
                GestureDetector(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const ExploreScreen()),
                    );
                  },
                  child: Text('See all', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: context.themeColors.primary500)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 220,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _suggestedBuilders.length,
              itemBuilder: (context, i) {
                final builder = _suggestedBuilders[i];
                final avatar = builder['avatar']?.toString();
                final name = builder['name'] ?? 'U';
                final initial = name.isNotEmpty ? name.substring(0, 1).toUpperCase() : '?';
                
                String finalUrl = avatar ?? '';
                if (finalUrl.isEmpty || !finalUrl.startsWith('http')) {
                  final seed = builder['id']?.toString() ?? name;
                  finalUrl = 'https://api.dicebear.com/9.x/micah/png?seed=${Uri.encodeComponent(seed)}&backgroundColor=transparent';
                }

                return Container(
                  width: 140,
                  margin: const EdgeInsets.only(right: 12),
                  decoration: BoxDecoration(
                    color: context.themeColors.surface,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: context.themeColors.borderSubtle),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.02),
                        blurRadius: 8,
                        offset: const Offset(0, 4),
                      )
                    ],
                  ),
                  child: GestureDetector(
                    onTap: () {
                      if (builder['id'] != null) {
                        Navigator.push(context, MaterialPageRoute(
                          builder: (context) => PublicProfileScreen(userId: builder['id'].toString()),
                        ));
                      }
                    },
                    child: Stack(
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const SizedBox(height: 8),
                            Container(
                              width: 64, height: 64,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: context.themeColors.surfaceHighlight,
                                border: Border.all(color: context.themeColors.borderSubtle, width: 1),
                              ),
                              child: ClipOval(
                                child: CachedNetworkImage(
                                  imageUrl: finalUrl,
                                  fit: BoxFit.cover,
                                  placeholder: (c, url) => Container(color: context.themeColors.surfaceHighlight),
                                  errorWidget: (c, e, s) => Center(child: Text(initial, style: TextStyle(fontWeight: FontWeight.bold, color: context.themeColors.textPrimary))),
                                ),
                              ),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              name,
                              style: TextStyle(color: context.themeColors.textPrimary, fontSize: 13, fontWeight: FontWeight.bold),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Builder on Patchwork',
                              style: TextStyle(color: context.themeColors.textTertiary, fontSize: 10),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              textAlign: TextAlign.center,
                            ),
                            const Spacer(),
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: () async {
                                  final builderId = builder['id'];
                                  final userId = Supabase.instance.client.auth.currentUser?.id;
                                  if (builderId != null && userId != null) {
                                    HapticFeedback.lightImpact();
                                    final isFollowing = _followingBuilders.contains(builderId);
                                    
                                    // Optimistic update
                                    setState(() {
                                      if (isFollowing) {
                                        _followingBuilders.remove(builderId);
                                      } else {
                                        _followingBuilders.add(builderId);
                                      }
                                    });
                                    
                                    try {
                                      if (isFollowing) {
                                        await Supabase.instance.client
                                            .from('follows')
                                            .delete()
                                            .eq('follower_id', userId)
                                            .eq('following_id', builderId);
                                      } else {
                                        await Supabase.instance.client
                                            .from('follows')
                                            .insert({
                                              'follower_id': userId,
                                              'following_id': builderId,
                                            });
                                      }
                                    } catch (e) {
                                      // Revert on failure
                                      if (mounted) {
                                        setState(() {
                                          if (isFollowing) {
                                            _followingBuilders.add(builderId);
                                          } else {
                                            _followingBuilders.remove(builderId);
                                          }
                                        });
                                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to update follow status')));
                                      }
                                    }
                                  }
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: _followingBuilders.contains(builder['id']) ? context.themeColors.surfaceHighlight : context.themeColors.primary500,
                                  foregroundColor: _followingBuilders.contains(builder['id']) ? context.themeColors.textPrimary : Colors.white,
                                  elevation: 0,
                                  padding: const EdgeInsets.symmetric(vertical: 0),
                                  minimumSize: const Size(0, 32),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                ),
                                child: Text(_followingBuilders.contains(builder['id']) ? 'Following' : 'Follow', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                              ),
                            ),
                          ],
                        ),
                      ),
                      Positioned(
                        top: 10,
                        right: 10,
                        child: GestureDetector(
                          onTap: () {
                            setState(() {
                              _suggestedBuilders.removeAt(i);
                            });
                          },
                          child: Icon(LucideIcons.x, size: 14, color: context.themeColors.textTertiary),
                        ),
                      ),
                    ],
                  ),
                ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
