import React from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../src/store/appStore';
import { usePosts } from '../../src/hooks/usePosts';
import { useOnlineStatus } from '../../src/hooks/useOnlineStatus';
import { PostCard, QuickActions } from '../../src/components';
import { QuickAction } from '../../src/types';

export default function HomeScreen() {
  const router = useRouter();
  const { quickActions } = useAppStore();
  const { posts, isLoading, fetchPosts } = usePosts();
  const { isOnline } = useOnlineStatus();

  const handleQuickAction = (action: QuickAction) => {
    switch (action.action) {
      case 'create_post':
        router.push('/create');
        break;
      case 'schedule':
        router.push('/calendar');
        break;
      case 'view_analytics':
        router.push('/analytics');
        break;
      case 'check_queue':
        // Navigate to queue
        break;
      case 'reply':
        // Navigate to replies
        break;
    }
  };

  const recentPosts = posts.slice(0, 5);

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-4 bg-white border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-gray-900">AdBazaar</Text>
            <Text className="text-sm text-gray-500">
              {isOnline ? 'Connected' : 'Offline Mode'}
            </Text>
          </View>
          <TouchableOpacity
            className="w-10 h-10 bg-indigo-100 rounded-full items-center justify-center"
            onPress={() => router.push('/profile')}
          >
            <Text className="text-lg">👤</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchPosts} />
        }
      >
        {/* Quick Actions */}
        <View className="mt-4">
          <Text className="text-lg font-semibold text-gray-900 px-4 mb-2">
            Quick Actions
          </Text>
          <QuickActions actions={quickActions} onAction={handleQuickAction} />
        </View>

        {/* Recent Posts */}
        <View className="px-4 mt-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-gray-900">
              Recent Posts
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/create')}>
              <Text className="text-sm text-indigo-600 font-semibold">
                View All
              </Text>
            </TouchableOpacity>
          </View>

          {recentPosts.length === 0 ? (
            <View className="bg-white rounded-2xl p-8 items-center">
              <Text className="text-4xl mb-3">📝</Text>
              <Text className="text-gray-600 text-center mb-4">
                No posts yet. Create your first post!
              </Text>
              <TouchableOpacity
                className="bg-indigo-600 px-6 py-3 rounded-xl"
                onPress={() => router.push('/create')}
              >
                <Text className="text-white font-semibold">Create Post</Text>
              </TouchableOpacity>
            </View>
          ) : (
            recentPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onPress={() => router.push(`/post/${post.id}`)}
                onEdit={() => router.push(`/create?edit=${post.id}`)}
              />
            ))
          )}
        </View>

        {/* Stats Summary */}
        <View className="px-4 mt-6 mb-8">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            This Week
          </Text>
          <View className="flex-row">
            <View className="flex-1 bg-white rounded-2xl p-4 mr-2 items-center shadow-sm">
              <Text className="text-2xl font-bold text-indigo-600">
                {posts.filter((p) => p.status === 'published').length}
              </Text>
              <Text className="text-xs text-gray-500 mt-1">Published</Text>
            </View>
            <View className="flex-1 bg-white rounded-2xl p-4 mr-2 items-center shadow-sm">
              <Text className="text-2xl font-bold text-blue-600">
                {posts.filter((p) => p.status === 'scheduled').length}
              </Text>
              <Text className="text-xs text-gray-500 mt-1">Scheduled</Text>
            </View>
            <View className="flex-1 bg-white rounded-2xl p-4 items-center shadow-sm">
              <Text className="text-2xl font-bold text-gray-600">
                {posts.filter((p) => p.status === 'draft').length}
              </Text>
              <Text className="text-xs text-gray-500 mt-1">Drafts</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
