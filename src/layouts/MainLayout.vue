<template>
  <q-layout view="lHh Lpr lFf">
    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      side="left"
      bordered
      class="bg-grey-1"
    >
      <q-list>
        <EssentialLink
          v-for="link in essentialLinks"
          :key="link.title"
          v-bind="link"
        />
          <q-item clickable @click="onLogout">
            <q-item-section avatar>
              <q-icon name="exit_to_app" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Logout</q-item-label>
            </q-item-section>
          </q-item>
      </q-list>
    </q-drawer>
    <q-drawer
      v-if="onBuildFeed"
      v-model="rightDrawerOpen"
      show-if-above
      bordered
      class="bg-grey-1"
      side="right"
    >
      <build-feed-search-form @hideSearchPanel="toggleRightDrawer"/>
    </q-drawer>

    <q-page-container>
      <router-view />
      <q-page-sticky position="top-left" :offset="[5, 10]">
        <q-btn round color="primary" icon="menu" @click="toggleLeftDrawer"/>
      </q-page-sticky>
      <q-page-sticky v-if="onBuildFeed" position="top-right" :offset="[5, 10]">
        <q-btn round color="primary" icon="search" @click="toggleRightDrawer"/>
      </q-page-sticky>
    </q-page-container>
  </q-layout>
</template>

<script>
import EssentialLink from 'components/EssentialLink.vue'
import BuildFeedSearchForm from 'components/BuildFeedSearchForm.vue'

const linksList = [
  {
    title: 'Feed',
    icon: 'view_list',
    link: '/'
  },
  {
    title: 'New build',
    icon: 'create',
    link: '/build/create'
  },
  {
    title: 'New distribution',
    icon: 'earbuds',
    link: '/distro/new'
  }
];

import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'MainLayout',
  components: {
    BuildFeedSearchForm,
    EssentialLink
  },
  computed: {
    onBuildFeed () {
      return this.$route.name && this.$route.name.startsWith('BuildFeed')
    }
  },
  setup () {
    const leftDrawerOpen = ref(false)
    const rightDrawerOpen = ref(false)

    return {
      essentialLinks: linksList,
      leftDrawerOpen,
      toggleLeftDrawer () {
        leftDrawerOpen.value = !leftDrawerOpen.value
      },
      rightDrawerOpen,
      toggleRightDrawer () {
        rightDrawerOpen.value = !rightDrawerOpen.value
      }
    }
  },
  methods: {
    onLogout () {
      this.$store.commit('users/onLogout')
    }
  }
})
</script>
