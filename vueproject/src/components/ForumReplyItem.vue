<template>
  <div class="reply-item flex items-start gap-3 text-left" :class="{ nested }">
    <router-link :to="`/profile/${reply.authorId}`" class="shrink-0"><img loading="lazy" :src="avatarUrl(reply.avatar)" :alt="`${reply.authorName}的头像`" class="avatar" /></router-link>
    <div class="min-w-0 flex-1 text-left">
      <div class="flex items-start justify-between gap-2">
        <div class="flex min-w-0 flex-col items-start gap-1 text-left">
          <div class="flex flex-wrap items-center gap-2"><router-link :to="`/profile/${reply.authorId}`" class="font-semibold text-sky-300 hover:text-sky-200">{{ reply.authorName }}</router-link><span v-if="reply.authorId === postAuthorId" class="owner-tag">楼主</span><span v-if="reply.status !== 'visible'" class="status-tag">{{ statusText(reply.status) }}</span></div>
          <TitleBadge v-if="reply.titleName && reply.titleTier" compact :name="reply.titleName" :tier="reply.titleTier" :acquisition-method="reply.titleAcquisitionMethod" />
        </div>
        <span v-if="!nested && reply.floorNumber" class="shrink-0 text-xs text-slate-400">{{ reply.floorNumber }} 楼</span>
      </div>
      <p v-if="reply.parentReplyId && reply.parentAuthorName" class="mt-2 text-xs text-slate-400">回复 <span class="text-sky-300">@{{ reply.parentAuthorName }}</span></p>
      <p class="mt-3 whitespace-pre-wrap break-words text-left text-sm leading-7 text-slate-200">{{ reply.content }}</p>
      <div v-for="image in reply.images" :key="image.id" class="mt-3"><button type="button" @click="$emit('preview', image.url)"><img loading="lazy" :src="image.url" alt="回复图片" class="reply-image" /></button></div>
      <div class="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400"><span>{{ formatTime(reply.createdAt) }}</span><button v-if="reply.status === 'visible'" class="text-button" @click="$emit('like', reply.id)">{{ reply.liked ? '♥' : '♡' }} {{ reply.likeCount }}</button><button v-if="reply.status === 'visible'" class="text-button" @click="$emit('reply', reply)">回复</button><button v-if="reply.authorId !== me && reply.status === 'visible'" class="text-button" @click="$emit('report', reply.id)">举报</button><button v-if="(reply.authorId === me || postAuthorId === me) && reply.status !== 'deleted'" class="text-button danger" @click="$emit('delete', reply)">删除</button></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ForumReply } from '@/api/forum'
import TitleBadge from '@/components/TitleBadge.vue'
import defaultAvatar from '@/assets/default-avatar.png'

defineProps<{ reply: ForumReply; postAuthorId: number; me: number; nested?: boolean }>()
defineEmits<{ like: [id: number]; reply: [reply: ForumReply]; report: [id: number]; delete: [reply: ForumReply]; preview: [url: string] }>()

function formatTime(value: string): string { return value ? new Date(value).toLocaleString('zh-CN') : '' }
function statusText(value: string): string { return value === 'hidden' ? '举报后隐藏' : '已删除' }
function avatarUrl(value?: string): string { return value ? (/^https?:\/\//.test(value) || value.startsWith('/') ? value : `/${value}`) : defaultAvatar }
</script>

<style scoped>
.reply-item { width: 100%; }
.reply-item.nested { padding: 14px 16px; border-radius: 12px; background: rgba(30, 41, 59, .5); }
.avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; background: #334155; }
.nested .avatar { width: 36px; height: 36px; }
.owner-tag, .status-tag { border-radius: 999px; padding: 2px 8px; font-size: 11px; }
.owner-tag { color: #7dd3fc; background: rgba(14, 165, 233, .18); }
.status-tag { color: #fde68a; background: rgba(251, 191, 36, .15); }
.reply-image { max-width: 260px; max-height: 230px; border-radius: 10px; object-fit: contain; }
.text-button { color: inherit; font-size: inherit; }
.text-button:hover { color: #7dd3fc; }
.text-button.danger:hover { color: #fda4af; }
@media (max-width: 640px) { .avatar { width: 42px; height: 42px; } .nested .avatar { width: 32px; height: 32px; } .reply-item.nested { padding: 12px; } }
</style>
