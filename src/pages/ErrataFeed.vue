<template>
    <div class="q-pl-xl row" max-width>
        <div class="q-pa-md" style="width: 40%">
            <div class="q-gutter-md row items-start">
                <q-select
                    v-model="platform"
                    :options="platforms"
                    label="Platform"
                    class="col"
                    style="width: 5%"
                    clearable
                />

                <q-input
                    v-model="bulletinTitle"
                    class="col"
                    label="Bulletin title"
                    @keydown.enter.prevent="searchErrata()"
                />
            </div>
            <div class="q-py-md q-gutter-md row items-start">
                <q-input
                    v-model="id"
                    label="Advisory ID"
                    class="col"
                    @keydown.enter.prevent="searchErrata()"
                />

                <q-input
                    v-model="cveId"
                    label="CVE ID"
                    class="col"
                    @keydown.enter.prevent="searchErrata()"
                />
            </div>
            <div class="q-pb-md group row justify-end">
                <q-btn @click="searchErrata()" no-caps icon="search"
                       color="primary" :loading="loading">
                    Search
                </q-btn>
            </div>
            <q-table
                title="Advisory"
                :rows="advisors"
                :columns="columns"
                color="primary"
                :loading="loadingTable"
                :rows-per-page-options=[10]
                hide-pagination
                binary-state-sort
                wrap-cells>
                <template v-slot:body="props">
                    <q-tr :props="props" class="cursor-pointer"
                            :class="markAdvisory(props.row.id)"
                            @click="loadAdvisory(props.row.id)">
                        <q-td key="updated_date" :props="props">{{ formatDate(props.row.updated_date) }}</q-td>
                        <q-td key="id" :props="props">{{ props.row.id }}</q-td>
                        <q-td key="original_title" :props="props">{{ title(props.row) }}</q-td>
                    </q-tr>
                </template>
            </q-table>
            <div class="row justify-center">
                <q-pagination input :max="totalPages" v-model="currentPage" size="sm"/>
            </div>
        </div>
        
        <div class="q-pa-lg items-start" style="width: 60%">
            <errata-info ref="errataInfo" :platforms="platforms" @updateFeed="loadAdvisors" @updatePackages="loadAdvisory"/>
        </div>
    </div>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { Notify } from 'quasar'
import ErrataInfo from 'components/ErrataInfo.vue'

export default defineComponent({
  data () {
    return {
        bulletinTitle: '',
        id: '',
        cveId: '',
        platform: null,
        loading: false,
        loadingTable: false,
        totalPages: ref(1),
        selectedAdvisory: null,
        columns: [ 
            { name: 'updated_date', required: true, label: 'Update date', align: 'left', field: 'updated_date', headerStyle: 'width: 120px' },
            { name: 'id', required: true, align: 'left', label: 'ID', field: 'id'},
            { name: 'original_title', required: true, align: 'left', label: 'Bulletin title', field: 'original_title' }],
        advisors: [],
    }
  },
  created () {
      this.loadAdvisors({ pageNumber: this.errataPageNumber})
  },
  computed: {
    platforms () {
        return this.$store.state.platforms.platforms.map(platform => {
            return {label: platform.name, value: platform.id, arch_list: platform.arch_list }
        })
    },
    errataPageNumber () {
            return this.$store.getters['errataFeed/errataPageNumber']
    },
    currentPage: {
        get () { return this.$store.state.errataFeed.pageNumber },
        set (value) {
            this.$store.commit('errataFeed/setPageNumber', value)
            this.loadAdvisors ()
        }
    }
  },
  methods: {
    searchErrata () {
        this.loading = true
        this.currentPage = 1
    },
    loadAdvisors () {
        let query = {
            title: this.bulletinTitle,
            id: this.id,
            cveId: this.cveId,
            pageNumber: this.errataPageNumber
        }
        if (this.platform) query.platformId = this.platform.value 
        this.loadingTable = true
        this.$api.get(`/errata/query/`, {params: query})
        .then(response => {
            this.loading = false
            this.loadingTable = false
            this.advisors = response.data.records
            this.totalPages = Math.ceil(response.data['total_records'] / 10)
        })
        .catch(error => {
            this.loading = false
            this.loadingTable = false
            Notify.create({
                message: `${error.response.status}: ${error.response.statusText}`,
                type: 'negative',
                actions: [
                    { label: 'Dismiss', color: 'white', handler: () => {} }
                ]
            })
        })
    },
    loadAdvisory (id) {
        this.loadingTable = true
        let query = { errata_id: id }
        this.$api.get(`/errata/`, {params: query})
        .then(response => {
            this.loadingTable = false
            this.selectedAdvisory = response.data
            this.$refs.errataInfo.open(this.selectedAdvisory)
        })
        .catch(error => {
            console.log(error)
            this.loadingTable = false
            Notify.create({
                message: `Failed to load advisory with id: ${id}`,
                type: 'negative',
                actions: [
                    { label: 'Dismiss', color: 'white', handler: () => {} }
                ]
            })
        })
    },
    markAdvisory (id) {
        if (this.selectedAdvisory) return this.selectedAdvisory.id === id ? 'bg-grey-4' : ''       
    },
    formatDate (date) {
        const longEnUSFormatter = new Intl.DateTimeFormat('en-US', {
            year:  'numeric',
            month: 'long',
            day:   'numeric',
        })
        return longEnUSFormatter.format(new Date(date))
    },
    title (advisory) {
        return advisory.title ? advisory.title : advisory.original_title
    }
  },
  components: {
    ErrataInfo
  }
})
</script>

<style scoped>
</style>
