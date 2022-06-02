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
      <q-input v-model="filter.projectName" label="Project name"/>
      <q-input v-model="filter.buildRef" label="Git tag, branch, change or src-RPM"/>
      <q-input v-model="filter.rpmName" label="RPM package name"/>
      <q-input v-model="filter.rpmEpoch" label="RPM package epoch"/>
      <q-input v-model="filter.rpmVersion" label="RPM package version"/>
      <q-input v-model="filter.rpmRelease" label="RPM package release"/>
      <q-input v-model="filter.rpmArch" label="RPM package architecture"/>
      <q-select
        v-model="selectedPlatform"
        label="Platform"
        use-input
        input-debounce="0"
        :options="allPlatforms"
        @filter="platformSelectFilter"
        @update:model-value="onPlatformSelected"
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
      <q-input v-model="filter.buildTaskArch" label="Build task architecture"/>
      <q-toggle v-model="filter.released" left-label label="Build is released"/>
      <q-toggle v-model="filter.signed" left-label label="Build is signed"/>
    </q-list>
    <div class="row group justify-end">
      <q-btn @click="hideSearchPanel" flat>
        <q-icon name="keyboard_tab"/>
        <q-tooltip anchor="bottom left" self="top middle" class="text-body2">
          Hide filter pane
        </q-tooltip>
      </q-btn>
      <q-btn @click="resetFilter" flat>
        <q-icon name="settings_backup_restore"/>
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
      '$store.state.buildsFeed.filter': 'loadFilter'
    },
    methods: {
      onPlatformSelected (value) {
        this.filter.platformId = value.value
      },
      onUserSelected (value) {
        this.filter.authorId = value.value
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
          this.$router.push(`/search/${query}`)
          return
        }
        this.$router.push('/')
      },
      filterToQuery (filter) {
        let query = ''
        if (filter.authorId) {query += `created_by=${filter.authorId}&`}
        if (filter.projectName) { query += `project=${filter.projectName}&` }
        if (filter.buildRef) { query += `ref=${filter.buildRef}&` }
        if (filter.rpmName) { query += `rpm_name=${filter.rpmName}&` }
        if (filter.rpmEpoch) { query += `rpm_epoch=${filter.rpmEpoch}&` }
        if (filter.rpmVersion) { query += `rpm_version=${filter.rpmVersion}&` }
        if (filter.rpmRelease) { query += `rpm_release=${filter.rpmRelease}&` }
        if (filter.rpmArch) { query += `rpm_arch=${filter.rpmArch}&` }
        if (filter.released) { query += `released=${filter.released}&` }
        if (filter.signed) { query += `signed=${filter.signed}&` }
        if (filter.platformId) { query += `platform_id=${filter.platformId}&` }
        if (filter.buildTaskArch) { query += `arch=${filter.buildTaskArch}&` }
        return query.slice(0, query.length - 1)
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
