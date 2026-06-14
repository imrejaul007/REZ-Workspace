import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRoute } from '@react-navigation/native';
import api from '../services/api';

export default function MessageScreen() {
 const route = useRoute<unknown>();
 const { sessionId } = route.params || {};
 const [messages, setMessages] = useState<unknown[]>([]);
 const [newMessage, setNewMessage] = useState('');

 useEffect(() => {
   loadMessages();
 }, [sessionId]);

 async function loadMessages() {
   try {
     const response = await api.getSessionMessages(sessionId);
     if (response.success) {
       setMessages(response.data);
     }
   } catch (error) {
     logger.error('Load messages error:', error);
   }
 }

 async function sendMessage() {
   if (!newMessage.trim()) return;

   try {
     const response = await api.sendSessionMessage(sessionId, {
       content: newMessage.trim(),
       type: 'text',
     });
     if (response.success) {
       setNewMessage('');
       loadMessages();
     }
   } catch (error) {
     logger.error('Send error:', error);
   }
 }

 return (
   <KeyboardAvoidingView
     style={styles.container}
     behavior={Platform.OS === 'ios' ? 'padding' : undefined}
     keyboardVerticalOffset={90}
   >
     <FlatList
       data={messages}
       keyExtractor={(item) => item.messageId}
       renderItem={({ item }) => (
         <View style={[styles.messageRow, item.senderRole === 'owner' && styles.ownerMessage]}>
           <View style={[styles.messageBubble, item.senderRole === 'owner' && styles.ownerBubble]}>
             <Text style={[styles.messageText, item.senderRole === 'owner' && styles.ownerText]}>
               {item.content}
             </Text>
             <Text style={styles.messageTime}>
               {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
             </Text>
           </View>
         </View>
       )}
       contentContainerStyle={styles.messageList}
       ListEmptyComponent={
         <View style={styles.empty}>
           <Text style={styles.emptyText}>No messages yet</Text>
         </View>
       }
     />
     <View style={styles.inputContainer}>
       <TextInput
         style={styles.input}
         placeholder="Type a message..."
         placeholderTextColor="#9ca3af"
         value={newMessage}
         onChangeText={setNewMessage}
         multiline
       />
       <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
         <Text style={styles.sendButtonText}>Send</Text>
       </TouchableOpacity>
     </View>
   </KeyboardAvoidingView>
 );
}

const styles = StyleSheet.create({
 container: {
   flex: 1,
   backgroundColor: '#f9fafb',
 },
 messageList: {
   padding: 16,
 },
 messageRow: {
   marginBottom: 12,
   alignItems: 'flex-start',
 },
 ownerMessage: {
   alignItems: 'flex-end',
 },
 messageBubble: {
   maxWidth: '80%',
   backgroundColor: '#fff',
   padding: 12,
   borderRadius: 16,
   borderBottomLeftRadius: 4,
 },
 ownerBubble: {
   backgroundColor: '#6366f1',
   borderBottomLeftRadius: 16,
   borderBottomRightRadius: 4,
 },
 messageText: {
   fontSize: 16,
   color: '#1f2937',
 },
 ownerText: {
   color: '#fff',
 },
 messageTime: {
   fontSize: 10,
   color: '#9ca3af',
   marginTop: 4,
   alignSelf: 'flex-end',
 },
 empty: {
   padding: 40,
   alignItems: 'center',
 },
 emptyText: {
   color: '#9ca3af',
 },
 inputContainer: {
   flexDirection: 'row',
   padding: 12,
   backgroundColor: '#fff',
   borderTopWidth: 1,
   borderTopColor: '#e5e7eb',
 },
 input: {
   flex: 1,
   backgroundColor: '#f3f4f6',
   borderRadius: 20,
   paddingHorizontal: 16,
   paddingVertical: 10,
   fontSize: 16,
   maxHeight: 100,
 },
 sendButton: {
   marginLeft: 8,
   backgroundColor: '#6366f1',
   borderRadius: 20,
   paddingHorizontal: 20,
   justifyContent: 'center',
 },
 sendButtonText: {
   color: '#fff',
   fontWeight: '600',
 },
});
