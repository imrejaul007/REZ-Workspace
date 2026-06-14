import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Post } from '../types';
import { format } from 'date-fns';
import clsx from 'clsx';

interface PostCardProps {
  post: Post;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function PostCard({ post, onPress, onEdit, onDelete }: PostCardProps) {
  const statusColors = {
    draft: 'bg-gray-100 text-gray-600',
    scheduled: 'bg-blue-100 text-blue-600',
    published: 'bg-green-100 text-green-600',
    failed: 'bg-red-100 text-red-600',
  };

  const statusLabels = {
    draft: 'Draft',
    scheduled: 'Scheduled',
    published: 'Published',
    failed: 'Failed',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100"
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <View
            className={clsx('px-2 py-1 rounded-full', statusColors[post.status])}
          >
            <Text className="text-xs font-medium">{statusLabels[post.status]}</Text>
          </View>
          {post.scheduledAt && (
            <Text className="ml-2 text-xs text-gray-500">
              {format(new Date(post.scheduledAt), 'MMM d, h:mm a')}
            </Text>
          )}
          {post.publishedAt && (
            <Text className="ml-2 text-xs text-gray-500">
              {format(new Date(post.publishedAt), 'MMM d, h:mm a')}
            </Text>
          )}
        </View>
        <View className="flex-row">
          {onEdit && (
            <TouchableOpacity
              onPress={onEdit}
              className="p-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text className="text-indigo-600 text-sm">Edit</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              onPress={onDelete}
              className="p-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text className="text-red-500 text-sm">Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <Text className="text-gray-800 text-base mb-3" numberOfLines={3}>
        {post.content}
      </Text>

      {/* Platforms */}
      <View className="flex-row items-center">
        {post.platforms.map((platform) => (
          <View
            key={platform.id}
            className="bg-gray-100 px-2 py-1 rounded-full mr-2"
          >
            <Text className="text-xs text-gray-600 capitalize">
              {platform.name}
            </Text>
          </View>
        ))}
      </View>

      {/* Analytics (if published) */}
      {post.status === 'published' && post.analytics && (
        <View className="mt-3 pt-3 border-t border-gray-100 flex-row justify-between">
          <View className="items-center">
            <Text className="text-sm font-semibold text-gray-800">
              {post.analytics.impressions}
            </Text>
            <Text className="text-xs text-gray-500">Impressions</Text>
          </View>
          <View className="items-center">
            <Text className="text-sm font-semibold text-gray-800">
              {post.analytics.engagement || 0}
            </Text>
            <Text className="text-xs text-gray-500">Engagement</Text>
          </View>
          <View className="items-center">
            <Text className="text-sm font-semibold text-gray-800">
              {post.analytics.reach}
            </Text>
            <Text className="text-xs text-gray-500">Reach</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}
