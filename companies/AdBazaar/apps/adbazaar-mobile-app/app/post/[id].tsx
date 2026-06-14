import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '../../src/store/appStore';
import { usePosts } from '../../src/hooks/usePosts';
import { Button } from '../../src/components';
import { format } from 'date-fns';
import { Post } from '../../src/types';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { posts } = useAppStore();
  const { editPost, deletePost, schedulePost, publishPost } = usePosts();

  const post = posts.find((p) => p.id === id);

  if (!post) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-gray-600">Post not found</Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            variant="outline"
            className="mt-4"
          />
        </View>
      </SafeAreaView>
    );
  }

  const statusColors = {
    draft: 'bg-gray-100 text-gray-600',
    scheduled: 'bg-blue-100 text-blue-600',
    published: 'bg-green-100 text-green-600',
    failed: 'bg-red-100 text-red-600',
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deletePost(post.id);
            router.back();
          },
        },
      ]
    );
  };

  const handlePublish = async () => {
    const result = await publishPost(post.id);
    if (result) {
      Alert.alert('Success', 'Post published successfully');
    }
  };

  const handleSchedule = () => {
    // Open schedule modal
    Alert.alert('Schedule', 'Schedule functionality coming soon');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-4 py-4 bg-white border-b border-gray-100 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Text className="text-indigo-600 text-lg">Back</Text>
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900">Post Details</Text>
        <TouchableOpacity onPress={handleDelete} className="ml-auto">
          <Text className="text-red-500">Delete</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Status */}
        <View className="flex-row items-center mb-4">
          <View
            className={`px-3 py-1 rounded-full ${statusColors[post.status]}`}
          >
            <Text className="text-sm font-medium capitalize">{post.status}</Text>
          </View>
        </View>

        {/* Content */}
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <Text className="text-lg text-gray-900 leading-relaxed">
            {post.content}
          </Text>
        </View>

        {/* Platforms */}
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <Text className="text-sm font-semibold text-gray-500 mb-3">
            PLATFORMS
          </Text>
          <View className="flex-row flex-wrap">
            {post.platforms.map((platform) => (
              <View
                key={platform.id}
                className="bg-gray-100 px-3 py-2 rounded-full mr-2 mb-2"
              >
                <Text className="text-sm text-gray-700 capitalize">
                  {platform.name}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Schedule Info */}
        {(post.scheduledAt || post.publishedAt) && (
          <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
            <Text className="text-sm font-semibold text-gray-500 mb-2">
              {post.publishedAt ? 'PUBLISHED' : 'SCHEDULED'}
            </Text>
            <Text className="text-base text-gray-900">
              {format(
                new Date(post.publishedAt || post.scheduledAt!),
                'MMMM d, yyyy \'at\' h:mm a'
              )}
            </Text>
          </View>
        )}

        {/* Analytics */}
        {post.status === 'published' && post.analytics && (
          <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
            <Text className="text-sm font-semibold text-gray-500 mb-3">
              ANALYTICS
            </Text>
            <View className="flex-row">
              <View className="flex-1 items-center">
                <Text className="text-2xl font-bold text-gray-900">
                  {post.analytics.impressions}
                </Text>
                <Text className="text-xs text-gray-500">Impressions</Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-2xl font-bold text-gray-900">
                  {post.analytics.clicks}
                </Text>
                <Text className="text-xs text-gray-500">Clicks</Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-2xl font-bold text-gray-900">
                  {post.analytics.likes}
                </Text>
                <Text className="text-xs text-gray-500">Likes</Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-2xl font-bold text-gray-900">
                  {post.analytics.comments}
                </Text>
                <Text className="text-xs text-gray-500">Comments</Text>
              </View>
            </View>
          </View>
        )}

        {/* Timestamps */}
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-gray-500">Created</Text>
            <Text className="text-sm text-gray-900">
              {format(new Date(post.createdAt), 'MMM d, yyyy h:mm a')}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-500">Updated</Text>
            <Text className="text-sm text-gray-900">
              {format(new Date(post.updatedAt), 'MMM d, yyyy h:mm a')}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Actions */}
      <View className="p-4 bg-white border-t border-gray-100">
        {post.status === 'draft' && (
          <View className="flex-row">
            <View className="flex-1 mr-2">
              <Button
                title="Schedule"
                onPress={handleSchedule}
                variant="outline"
              />
            </View>
            <View className="flex-1 ml-2">
              <Button
                title="Publish Now"
                onPress={handlePublish}
              />
            </View>
          </View>
        )}
        {post.status === 'scheduled' && (
          <Button
            title="Edit Schedule"
            onPress={handleSchedule}
            variant="outline"
            className="w-full"
          />
        )}
      </View>
    </SafeAreaView>
  );
}
