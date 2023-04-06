<template>
  <div class="feed-search" @keyup.enter="applyFilter">
    <q-list no-border>
      <q-select
        v-model="selectedUser"
        :options="allUsernames"
        use-input
        input-debounce="0"
        label="Build author"
        @filter="userSelectFilter"
        @update:model-value="onUserSelected"
        clearable
      >
        <template v-slot:option="scope">
          <q-item v-bind="scope.itemProps">
            <q-item-section>
              <q-item-label>{{ scope.opt.label }}</q-item-label>
              <q-item-label caption>{{ scope.opt.sublabel }}</q-item-label>
            </q-item-section>
          </q-item>
        </template>
      </q-select>
      <q-input v-model="filter.projectName" label="Project name" />
      <q-input
        v-model="filter.buildRef"
        label="Git tag, branch, change or src-RPM"
      />
      <q-input v-model="filter.rpmName" label="RPM package name" />
      <q-input v-model="filter.rpmEpoch" label="RPM package epoch" />
      <q-input v-model="filter.rpmVersion" label="RPM package version" />
      <q-input v-model="filter.rpmRelease" label="RPM package release" />
      <q-input v-model="filter.rpmArch" label="RPM package architecture" />
      <q-select
        v-model="selectedPlatform"
        label="Platform"
        use-input
        input-debounce="0"
        :options="allPlatforms"
        @filter="platformSelectFilter"
        @update:model-value="onPlatformSelected"
        clearable
      >
        <template v-slot:option="scope">
          <q-item v-bind="scope.itemProps">
            <q-item-section>
              <q-item-label>{{ scope.opt.label }}</q-item-label>
              <q-item-label caption>{{ scope.opt.sublabel }}</q-item-label>
            </q-item-section>
          </q-item>
        </template>
      </q-select>
      <q-input v-model="filter.buildTaskArch" label="Build task architecture" />
      <q-toggle
        v-model="filter.released"
        left-label
        label="Build is released"
      />
      <q-toggle v-model="filter.signed" left-label label="Build is signed" />
    </q-list>
    <div class="row group justify-end">
      <q-btn @click="hideSearchPanel" flat>
        <q-icon name="keyboard_tab" />
        <q-tooltip anchor="bottom left" self="top middle" class="text-body2">
          Hide filter pane
        </q-tooltip>
      </q-btn>
      <q-btn @click="resetFilter" flat>
        <q-icon name="settings_backup_restore" />
        <q-tooltip anchor="bottom left" self="top middle" class="text-body2">
          Reset filter options
        </q-tooltip>
      </q-btn>
      <q-btn @click="applyFilter" icon="done" color="primary">
        Apply
        <q-tooltip anchor="bottom left" self="top middle" class="text-body2">
          Apply filter options
        </q-tooltip>
      </q-btn>
    </div>
  </div>
</template>

<script>
  import { QBtn, QIcon, QInput, QList, QSelect, QTooltip } from 'quasar'

  export default {
    name: 'build-feed-search-form',
    data () {
      return {
        userFilter: '',
        platformFilter: '',
        selectedUser: null,
        selectedPlatform: null,
        filter: {
          authorId: null,
          buildTag: '',
          projectName: '',
          buildRef: '',
          rpmName: '',
          rpmEpoch: '',
          rpmVersion: '',
          rpmRelease: '',
          rpmArch: '',
          platformId: null,
          buildTaskArch: '',
          released: false,
          signed: false
        }
      }
    },
    computed: {
      allPlatforms () {
        let value = this.$store.state.platforms.platforms.map(platform => {
          return {label: platform.name, sublabel: platform.arch_list.join(', '), value: platform.id}
        })
        if (this.platformFilter !== '') {
          return value.filter(item => item.label.toLowerCase().indexOf(this.platformFilter) > -1)
        }
        return value
      },
      allUsernames () {
        let value = this.$store.state.users.users.map(user => {
          return {label: user.username, sublabel: user.email, value: user.id}
        })
        if (this.userFilter !== '') {
          return value.filter(item => item.label.toLowerCase().indexOf(this.userFilter) > -1)
        }
        return value
      }
    },
    created () {
      this.loadFilter()
    },
    watch: {
      '$store.state.buildsFeed.filter': 'loadFilter',
      'allUsernames': 'setUserFromQuery',
      'allPlatforms': 'setPlatformFromQuery'
    },
    methods: {
      setUserFromQuery () {
        const filter = this.$store.state.buildsFeed.filter
        if (filter.authorId) {
          this.selectedUser = this.allUsernames.filter(user => user.value == filter.authorId)[0]
        }
      },
      setPlatformFromQuery () {
        const filter = this.$store.state.buildsFeed.filter
        if (filter.platformId) {
          this.selectedPlatform = this.allPlatforms.filter(platform => platform.value == filter.platformId)[0]
        }
      },
      onPlatformSelected (value) {
        this.filter.platformId = value ? value.value : ''
      },
      onUserSelected (value) {
        this.filter.authorId = value ? value.value : ''
      },
      platformSelectFilter (value, update) {
        this.platformFilter = value
        update(() => {})
      },
      userSelectFilter (value, update) {
        this.userFilter = value
        update(() => {})
      },
      loadFilter () {
        const filter = this.$store.state.buildsFeed.filter
        for (let field of Object.keys(this.filter)) {
          this.filter[field] = ''
        }
        if (filter) {
          for (let field of Object.keys(filter)) {
            this.filter[field] = filter[field]
          }
        }
      },
      applyFilter () {
        const filter = Object.assign({}, this.filter)
        const query = this.filterToQuery(filter)
        this.$store.dispatch('buildsFeed/updateFilter', (query) ? filter : undefined)
        if (query) {
          this.$router.push({path: `/search`, query: query})
          return
        }
        this.$router.push('/')
      },
      filterToQuery (filter) {
        let query = Object.fromEntries(Object.entries(filter).filter(([f]) => filter[f]))
        return query
      },
      hideSearchPanel () {
        this.$emit('hideSearchPanel')
      },
      resetFilter () {
        this.selectedUser = null
        this.selectedPlatform = null
        for (let field of Object.keys(this.filter)) {
          this.filter[field] = ''
        }
        this.$store.dispatch('buildsFeed/updateFilter', undefined)
        this.$router.push('/')
      }
    },
    components: { QBtn, QIcon, QInput, QList, QSelect, QTooltip }
  }
</script>

<style scoped>
  .feed-search {
    padding-left: 1em;
    padding-right: 1em;
  }
</style>
