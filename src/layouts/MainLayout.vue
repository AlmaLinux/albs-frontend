<template>
  <q-layout view="lHh LpR lFf">
    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      side="left"
      class="bg-grey-1 shadow-4"
    >
      <q-list>
        <EssentialLink
          v-for="link in essentialLinks"
          :key="link.title"
          v-bind="link"
          :id="link.id"
        />
        <q-item
          v-if="$store.getters.isAuthenticated"
          clickable
          @click="onLogout"
          id="left-drawer-link-logout"
        >
          <q-item-section avatar>
            <q-icon name="logout" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Logout</q-item-label>
          </q-item-section>
        </q-item>
        <q-item
          v-else
          clickable
          @click="onLogin"
          id="left-drawer-link-login"
        >
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
      class="bg-grey-1 shadow-2"
      side="right"
    >
      <build-feed-search-form @hideSearchPanel="toggleRightDrawer" />
    </q-drawer>

    <q-page-container>
      <router-view />
      <q-page-sticky position="top-left" :offset="[5, 10]">
        <q-btn
          round
          color="primary"
          class="shadow-4"
          icon="menu"
          @click="toggleLeftDrawer"
          id="q-btn-toggle-left-drawer"
        />
      </q-page-sticky>
      <q-page-sticky v-if="onBuildFeed" position="top-right" :offset="[5, 10]">
        <q-btn
          round
          color="primary"
          icon="search"
          @click="toggleRightDrawer"
          id="q-btn-toggle-right-drawer"
        />
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
      id: 'left-drawer-link-administration',
      icon: 'settings',
      expand: true,
      // is_superuser workaround
      // We update the allow value manually after the Link is populated
      allow: false,
      children: [
        {
          title: 'Users',
          id: 'left-drawer-link-administration-users',
          icon: 'manage_accounts',
          link: 'users',
        },
      ],
    },
    {
      title: 'Feed',
      id: 'left-drawer-link-feed',
      icon: 'view_list',
      link: '/',
      allow: true,
    },
    {
      title: 'New build',
      id: 'left-drawer-link-new-build',
      icon: 'create',
      link: 'build/create',
      allow: store.getters.isAuthenticated,
    },
    {
      title: 'Errata',
      id: 'left-drawer-link-errata',
      icon: 'bug_report',
      link: '/errata',
      allow: store.getters.isAuthenticated,
    },
    {
      title: 'Releases',
      id: 'left-drawer-link-releases',
      icon: 'cloud',
      expand: true,
      allow: store.getters.isAuthenticated,
      children: [
        {
          title: 'Release Feed',
          id: 'left-drawer-link-releases-release-feed',
          icon: 'cloud_circle',
          link: 'release-feed',
        },
        {
          title: 'New release',
          id: 'left-drawer-link-releases-new-release',
          icon: 'cloud_upload',
          link: 'release/create',
        },
      ],
    },
    {
      title: 'Products',
      id: 'left-drawer-link-products',
      icon: 'category',
      expand: true,
      allow: store.getters.isAuthenticated,
      children: [
        {
          title: 'Products Feed',
          id: 'left-drawer-link-products-products-feed',
          icon: 'list',
          link: 'product-feed',
        },
        {
          title: 'New product',
          id: 'left-drawer-link-products-new-product',
          icon: 'earbuds',
          link: 'product/new',
        },
      ],
    },
    {
      title: 'Teams',
      id: 'left-drawer-link-teams',
      icon: 'groups',
      link: 'team-feed',
      allow: store.getters.isAuthenticated,
    },
  ]

  import {defineComponent, ref} from 'vue'
  import {LocalStorage} from 'quasar'
  import {parseJwt} from '../utils'

  export default defineComponent({
    name: 'MainLayout',
    components: {
      BuildFeedSearchForm,
      EssentialLink,
    },
    computed: {
      onBuildFeed() {
        return this.$route.name && this.$route.name.startsWith('BuildFeed')
      },
    },
    mounted() {
      window.addEventListener('visibilitychange', (event) => {
        if (document.visibilityState === 'visible') {
          let user = LocalStorage.getItem('user')
          if (user) {
            let token = parseJwt(user.jwt_token)
            let tokenExpired = new Date(token.exp * 1000) <= Date.now()
            if (tokenExpired) {
              LocalStorage.set(
                'redirectPath',
                this.$router.currentRoute._value.href
              )
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
            LocalStorage.set(
              'redirectPath',
              this.$router.currentRoute._value.href
            )
            this.$router.go()
          }
        }
      })
      // is_superuser workaround
      // Here's where we show/hide the Admin section from the menu
      if (store.getters.isAuthenticated && store.getters.isAdmin) {
        let adminLink = this.essentialLinks.find(
          (link) => link.title === 'Administration'
        )
        adminLink.allow = true
      }
    },
    setup() {
      const leftDrawerOpen = ref(false)
      const rightDrawerOpen = ref(false)

      return {
        essentialLinks: linksList,
        leftDrawerOpen,
        toggleLeftDrawer() {
          leftDrawerOpen.value = !leftDrawerOpen.value
        },
        rightDrawerOpen,
        toggleRightDrawer() {
          rightDrawerOpen.value = !rightDrawerOpen.value
        },
      }
    },
    methods: {
      onLogout() {
        this.$store.commit('users/onLogout')
        this.$router.go()
      },
      onLogin() {
        this.$router.push('/auth/login')
        LocalStorage.set('redirectPath', this.$router.currentRoute._value.href)
      },
    },
  })
</script>
