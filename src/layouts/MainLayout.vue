<template>
  <q-layout view="lHh LpR lFf">
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
          <q-item v-if="$store.getters.isAuthenticated" clickable @click="onLogout">
            <q-item-section avatar>
              <q-icon name="logout" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Logout</q-item-label>
            </q-item-section>
          </q-item>
          <q-item v-else clickable @click="onLogin">
            <q-item-section avatar>
              <q-icon name="login" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Log in</q-item-label>
            </q-item-section>
          </q-item>
      </q-list>
    </q-drawer>
    <q-drawer
      v-if="onBuildFeed"
      v-model="rightDrawerOpen"
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
import store from '../store/index'

const linksList = [
  {
    title: 'Feed',
    icon: 'view_list',
    link: '/',
    allow: true
  },
  {
    title: 'New build',
    icon: 'create',
    link: '/build/create',
    allow: store.getters.isAuthenticated
  },
  {
    title: 'Errata',
    icon: 'bug_report',
    link: 'errata',
    allow: store.getters.isAuthenticated
  },
  {
    title: 'Release Feed',
    icon: 'cloud',
    link: 'release-feed',
    allow: store.getters.isAuthenticated
  },
  {
    title: 'New release',
    icon: 'new_releases',
    link: '/release/create',
    allow: store.getters.isAuthenticated
  },
  {
    title: 'New distribution',
    icon: 'earbuds',
    link: '/distro/new',
    allow: store.getters.isAuthenticated
  }
];

import { defineComponent, ref } from 'vue'
import { LocalStorage } from 'quasar'
import { parseJwt } from '../utils'

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
  mounted() {
    window.addEventListener('storage', (event) => {
      if (event.key === 'user') {
        let user = LocalStorage.getItem('user')
        if (user) {
          store.commit('users/updateSelf', user)
          this.$router.go()
        } else {
          LocalStorage.set('redirectPath', this.$router.currentRoute._value.href)
          this.$router.go()
        }
      }
    })
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
  created () {
    let user = LocalStorage.getItem('user')
    if (user) {
      let token = parseJwt(user.jwt_token)
        let dateExpires = Math.abs(new Date(token.exp * 1000) - Date.now())
        setTimeout(() => {
          LocalStorage.set('redirectPath', this.$router.currentRoute._value.href)
          this.$store.commit('users/onLogout')
          this.$router.push('/auth/login')
        }, dateExpires)
    }
  },
  methods: {
    onLogout () {
      this.$store.commit('users/onLogout')
      this.$router.go()
    },
    onLogin () {
      this.$router.push('/auth/login')
      LocalStorage.set('redirectPath', this.$router.currentRoute._value.href)
    }
  }
})
</script>
