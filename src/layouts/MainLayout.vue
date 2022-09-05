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
    title: 'Administration',
    icon: 'settings',
    expand: true,
    // is_superuser workaround
    // We update the allow value manually after the Link is populated
    allow: false,
    children: [
      {
        title: 'Users',
        icon: 'manage_accounts',
        link: 'users'
      }
    ]
  },
  {
    title: 'Feed',
    icon: 'view_list',
    link: '/',
    allow: true
  },
  {
    title: 'New build',
    icon: 'create',
    link: 'build/create',
    allow: store.getters.isAuthenticated
  },
  {
    title: 'Errata',
    icon: 'bug_report',
    link: '/errata',
    allow: store.getters.isAuthenticated
  },
  {
    title: 'Releases',
    icon: 'cloud',
    expand: true,
    allow: store.getters.isAuthenticated,
    children: [
      {
        title: 'Release Feed',
        icon: 'cloud_circle',
        link: 'release-feed'
      },
      {
        title: 'New release',
        icon: 'cloud_upload',
        link: 'release/create'
      },
    ]
  },
  {
    title: 'Products',
    icon: 'category',
    expand: true,
    allow: store.getters.isAuthenticated,
    children: [
      {
        title: 'Products Feed',
        icon: 'list',
        link: 'product-feed'
      },
      {
        title: 'New product',
        icon: 'earbuds',
        link: 'product/new'
      }
    ]
  },
  {
    title: 'Teams',
    icon: 'groups',
    link: 'team-feed',
    allow: store.getters.isAuthenticated
  },
];

import { defineComponent, ref } from 'vue'
import { LocalStorage } from 'quasar'
import { parseJwt } from '../utils'

export default defineComponent({
  name: 'MainLayout',
  // is_superuser workaround
  data () {
    return {
      currentUser: null
    }
  },
  components: {
    BuildFeedSearchForm,
    EssentialLink
  },
  computed: {
    onBuildFeed () {
      return this.$route.name && this.$route.name.startsWith('BuildFeed')
    }
  },
  created () {
    // is_superuser workaround
    // Store the currentUser and use it to determine whether
    // the admin section shold be shown/hidden
    if (store.getters.isAuthenticated) {
      store.state.users.users.forEach(user => {
        if (user.id == store.state.users.self.user_id) {
          this.currentUser = user
          this.$store.commit('users/updateIsAdmin', this.currentUser.is_superuser)
        }
      })
    }
  },
  mounted () {
    window.addEventListener('visibilitychange', (event) => {
      if (document.visibilityState === 'visible') {
        let user = LocalStorage.getItem('user')
        if (user) {
          let token = parseJwt(user.jwt_token)
          let tokenExpired = new Date(token.exp * 1000) <= Date.now()
          if (tokenExpired) {
            LocalStorage.set('redirectPath', this.$router.currentRoute._value.href)
            this.$store.commit('users/onLogout')
            this.$router.push('/auth/login')
          }
        }
      }
    })
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
    // is_superuser workaround
    // TODO: Investigate how to achieve this in a better way
    // Here's where we show/hide the Admin section from the menu
    if (store.getters.isAuthenticated) {
      let adminLink = this.essentialLinks.find(link => link.title === 'Administration')
      adminLink.allow = this.currentUser.is_superuser
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
      this.$router.go()
    },
    onLogin () {
      this.$router.push('/auth/login')
      LocalStorage.set('redirectPath', this.$router.currentRoute._value.href)
    }
  }
})
</script>
