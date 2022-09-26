<template>
  <q-page class="q-px-xl q-pt-md">
      <div class="row justify-center">
        <q-table
                style="width: 95%"
                :rows="releases"
                :columns="columns"
                row-key="name"
                :loading="loading"
                :rows-per-page-options="[0]"
                hide-pagination
            >
            <template v-slot:top>
                <div class="col q-table__title">Releases</div>

                <q-space />
                
                <div class="col">
                    <div class="row justify-end">
                        <q-btn color="primary" round size="md" :icon="show ? 'search_off' : 'search'" @click="showSearch()"></q-btn>
                    </div>
                    <q-slide-transition>
                        <div v-if="show">
                            <div class="row justify-end q-gutter-md">
                                <q-select
                                    v-model="platform"
                                    :options="platforms"
                                    label="Platform"
                                    class="col"
                                    clearable
                                    dense
                                />
                                <q-select
                                    v-model="product"
                                    :options="productsOptions"
                                    label="Product"
                                    class="col"
                                    input-debounce="300"
                                    @filter="productFilter"
                                    use-input
                                    clearable
                                    dense
                                />
                            </div>

                            <div class="row justify-end q-gutter-md q-pt-md">
                                <q-select
                                    v-model="status"
                                    :options="statuses"
                                    label="Status"
                                    class="col"
                                    clearable
                                    dense
                                />
                                <q-input
                                    dense
                                    disable
                                    class="col"
                                    label="Package"
                                    hint="Search by Packages will be available in the future"
                                /> 
                            </div>

                            <div class="row justify-end">
                                <div class="q-pt-md">
                                    <q-btn @click="searchReleases()" no-caps icon="search"
                                            color="primary" :loading="loading">
                                        Search
                                    </q-btn>
                                </div>
                            </div>
                        </div>
                    </q-slide-transition>
                </div>
            </template>
            <template v-slot:body="props">
                    <q-tr :props="props">
                        <q-td key="releaser" :props="props">
                            <a :href="`mailto:${props.row.owner.email}`">
                                {{props.row.owner.username}}
                            </a>
                        </q-td>
                        <q-td key="date" :props="props">
                            <span :class="props.row.created_at ? null : 'text-caption text-grey' ">
                                {{ createdAt(props.row.created_at) }}
                            </span>
                        </q-td>
                        <q-td key="product" :props="props">
                            
                            <router-link :to="{ path: `/product/${props.row.product.id}` }">
                                {{ props.row.product.name }}
                            </router-link>
                        </q-td>
                        <q-td key="status" :props="props">
                            <q-chip
                                :color="statusColor(props.row)"
                                text-color="white"
                                dense
                                class="text-weight-bolder"
                                square
                                >{{ releaseStatus.text[props.row.status] }}
                            </q-chip>
                        </q-td>
                        <q-td key="packages" :props="props">
                            <template v-for="project in getProjects(props.row.plan)" :key="project.name">
                                <router-link v-if="project.buildId"
                                             class="text-weight-small cursor-pointer text-primary"
                                             :to="{path: `/build/${project.buildId}`}"
                                             target="_blank">
                                    {{project.name}}
                                </router-link>
                                <span v-else class="text-weight-small text-primary">
                                    {{project.name}}
                                </span>
                                <span class="text-grey-8">
                                    #{{project.version}}-{{project.release}}
                                </span>
                            <br/>
                        </template>
                        </q-td>
                        <q-td auto-width class="text-right">
                            <q-icon v-if="warningLogs(props.row)" name="warning" color="orange" size="sm">
                            <q-tooltip>
                                This release has additional info in logs
                            </q-tooltip>
                        </q-icon>
                            <q-btn class="gt-xs" flat dense round icon="info" @click="onReleaseView(props.row)" />
                        </q-td>
                    </q-tr>
                </template>
        </q-table>
    </div>
    <div class="q-pa-lg flex flex-center">
      <q-pagination input :max="totalPages" v-model="currentPage" :disable="loading"/>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { ReleaseStatus } from 'src/constants'
import { Notify } from 'quasar'

export default defineComponent({
    data() {
        return {
            platform: null,
            product: null,
            productsOptions: ref([]),
            status: null,
            loading: false,
            show: false,
            columns: [
                { name: 'releaser', required: true, align: 'left', label: 'Releaser', field: 'releaser'},
                { name: 'date', required: true, align: 'left', label: 'Created at', field: 'date', style: 'width: 100px; word-break: break-word;' },
                { name: 'product', required: true, align: 'center', label: 'Product', field: 'product' },
                { name: 'status', required: true, align: 'center', label: 'Status', field: 'status'},
                { name: 'packages', required: true, align: 'left', label: 'Packages', field: 'packages' },
                { name: 'buttons', required: true, align: 'right', label: '', field: 'buttons' }  
            ],
            releases: [],
            releaseStatus: ReleaseStatus,
            totalPages: ref(1),
        }
    },
    created () {
        this.loadFeedPage()
    },
    computed: {
        platforms () {
            return this.$store.state.platforms.platforms.map(platform => {
                return {label: platform.name, value: platform.id, arch_list: platform.arch_list }
            })
        },
        products () {
            return this.$store.state.products.products.map(product => {
                return {label: product.name, value: product.id }
            }).sort((a, b) => (a.value > b.value) ? 1 : ((b.value > a.value) ? -1 : 0) )
        },
        statuses () {
            return Object.values(this.releaseStatus.text).map((status, index) => {
                return { label: status, value: index + 1 }
            })
        },
        releasePageNumber () {
            return this.$store.getters['releaseFeed/releasePageNumber']
        },
        currentPage: {
            get () { return this.$store.state.releaseFeed.pageNumber },
            set (value) {
                this.loading = true
                this.$store.commit('releaseFeed/setPageNumber', value)
                this.loadFeedPage()
            }
        }
    },
    methods: {
        productFilter (val, update, abort) {
            update(() => {
                const needle = val.toLocaleLowerCase()
                this.productsOptions = this.products.filter(v => v.label.toLocaleLowerCase().indexOf(needle) > -1)
            })
            abort(() => {
                val = ''
            })
        },
        showSearch () {
            this.show = !this.show
            if (!this.show){
                this.platform = null
                this.product = null
                this.status = null
                this.searchReleases()
            }
        },
        searchReleases () {
            this.currentPage = 1
        },
        onReleaseView (release) {
            this.$router.push(`/release/${release.id}`)
        },
        loadFeedPage () {
            this.loading = true
            let query = {
                pageNumber: this.releasePageNumber,
                status: this.status ? +this.status.value : null,
                product_id: this.product ? +this.product.value : null,
                platform_id: this.platform ? +this.platform.value : null
            }
            this.$api.get(`/releases/`, {params: query})
                .then(response => {
                    this.loading = false
                    this.releases = response.data.releases
                    this.totalPages = Math.ceil(response.data['total_releases'] / 10)
                })
            .catch(error => {
                this.loading = false
                console.log(error)
                Notify.create({
                    message: `${error.response.status}: ${error.response.statusText}`,
                    type: 'negative',
                    actions: [
                        { label: 'Dismiss', color: 'white', handler: () => {} }
                    ]
                })
            })
        },
        statusColor(release){
            let col = ''
            switch (release.status) {
                case this.releaseStatus.SCHEDULED:
                    col = 'grey'
                    break;
                case this.releaseStatus.IN_PROGRESS:
                    col = 'primary'
                    break;
                case this.releaseStatus.COMPLETED:
                    col = 'green'
                    break;
                case this.releaseStatus.FAILED:
                    col = 'negative'
                    break;
            }
            return col
        },
        createdAt (date) {
            if (!date) return 'no date'
            
            return new Date(date).toLocaleString()
        },
        getProjects(plan){
            let packages = []
            let setPackages = new Set()
            plan.packages.forEach(pack => {
                let buildId = pack.package.build_id ? pack.package.build_id : null

                if (pack.package.source) {
                    let name = pack.package.source.split(`-${pack.package.version}-`)[0]
                    if (!setPackages.has(name)) {
                        packages.push(
                            {
                                name: name,
                                version: pack.package.version,
                                release: pack.package.release,
                                buildId: buildId
                            }
                        )
                        setPackages.add(name)
                    }
                } else if (pack.package.arch === 'src') {
                    if (!setPackages.has(pack.package.name)) {
                        packages.push(
                            {
                                name: pack.package.name,
                                version: pack.package.version,
                                release: pack.package.release,
                                buildId: buildId
                            }
                        )
                        setPackages.add(pack.package.name)
                    }
                }
            })

            if (packages.length === 0){
                plan.packages.forEach(pack => {
                    if (!setPackages.has(pack.package.name)) {
                        let buildId = pack.package.build_id ? pack.package.build_id : null
                        
                        packages.push(
                            {
                                name: pack.package.name,
                                version: pack.package.version,
                                release: pack.package.release,
                                buildId: buildId
                            }
                        )
                        setPackages.add(pack.package.name)
                    }
                })
            }
            return packages
        },
        warningLogs (release) {
            let warning = false
            if (release.plan.last_log) {
                if (release.plan.last_log.includes('WARNING'))
                    warning = true
            }
            return warning
        }
    }
})
</script>
