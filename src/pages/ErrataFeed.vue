<template>
    <div class="q-pl-xl row" max-width>
        <div class="q-pa-md" style="width: 35%">
            <div class="q-gutter-md row items-start">
                <q-select
                    v-model="platform"
                    :options="platforms"
                    label="Platform*"
                    class="col"
                    style="width: 5%"
                    clearable
                />

                <q-input v-model="bulletinTitle" class="col" label="Bulletin title"/>
            </div>
            <div class="q-py-md q-gutter-md row items-start">
                <q-input v-model="id" label="Advisory ID" class="col"/>

                <q-input v-model="cveId" label="CVE ID" class="col"/>
            </div>
            <div class="q-pb-md group row justify-end">
                <q-btn @click="currentPage = 1" no-caps icon="search" color="primary" :loading="loading">
                    Search
                </q-btn>
            </div>
            <div v-if="advisors">
                <q-table
                    title="Advisory"
                    :rows="advisors"
                    :columns="columns"
                    color="primary"
                    :loading="loading"
                    :rows-per-page-options=[10]
                    hide-pagination
                    binary-state-sort
                    wrap-cells>
                    <template v-slot:body="props">
                            <q-tr :props="props" class="cursor-pointer" :class="markAdvisory(props.row.id)" @click="loadAdvisory(props.row.id)">
                                <q-td key="updated_date" :props="props">{{ props.row.updated_date }}</q-td>
                                <q-td key="id" :props="props">{{ props.row.id }}</q-td>
                                <q-td key="original_title" :props="props">{{ props.row.original_title }}</q-td>
                            </q-tr>
                    </template>
                </q-table>
                <div class="row justify-center">
                    <q-pagination input :max="totalPages" v-model="currentPage" size="sm"/>
                </div>
            </div>
        </div>
        <div class="q-pa-lg items-start q-gutter-md" style="width: 65%" v-if="selectedAdvisory">
            <q-card>
                <q-card-section class="row q-gutter-md" style="max-width: 100%">
                    <q-field label="Platform" stack-label class="col">
                        <template v-slot:control>
                            <div class="self-center full-width no-outline" tabindex="0">AlmaLinux-8</div>
                        </template>
                    </q-field>
                    <q-field label="Definitive version" class="col" stack-label >
                        <template v-slot:control>
                            <div class="self-center full-width no-outline" tabindex="0">{{selectedAdvisory.definition_version}}</div>
                        </template>
                    </q-field>
                    <q-field label="Issued Date" class="col" stack-label>
                        <template v-slot:control>
                            <div class="self-center full-width no-outline" tabindex="0">{{selectedAdvisory.issued_date}}</div>
                        </template>
                    </q-field>
                    <q-field label="Updated Date" class="col" stack-label>
                        <template v-slot:control>
                            <div class="self-center full-width no-outline" tabindex="0">{{selectedAdvisory.updated_date}}</div>
                        </template>
                    </q-field>
                </q-card-section>
                <q-card-section class="q-gutter-md" style="max-width: 100%">
                    <q-input v-model="selectedTitle" label="Bulletin title">
                        <template v-slot:append>
                            <q-btn v-if="titleWarn" round dense flat color="warning" icon="warning" @click="showTitle = true">
                                <q-tooltip>
                                    Bulletin title in Pulp and ALBS DB is different.<br>Click to show the original title
                                </q-tooltip>
                            </q-btn>
                        </template>
                    </q-input>
                    <q-input type="textarea" input-style="height: 250px"
                             v-model="selectedDescription" label="Description">
                        <template v-slot:append>
                            <q-btn v-if="descriptionWarn" round dense flat color="warning" icon="warning" @click="showDescription = true">
                                <q-tooltip>
                                    The description in Pulp and ALBS DB is different.<br>Click to show the original description
                                </q-tooltip>
                            </q-btn>
                        </template>
                    </q-input>
                </q-card-section>
                <q-card-section align="center">
                    <q-tabs
                        v-model="tab"
                        dense
                        class="text-grey"
                        active-color="primary"
                        indicator-color="primary"
                        align="justify"
                        narrow-indicator
                        style="width: 60%"
                        >
                            <q-tab name="patchInfo" no-caps label="Patch Info"/>
                            <q-tab name="packages" no-caps label="Packages"/>
                        </q-tabs>

                        <q-separator />

                        <q-tab-panels v-model="tab" animated>
                            <q-tab-panel name="patchInfo">
                                <q-expansion-item label="CVE information" expand-separator
                                                  icon="privacy_tip" default-opened align="left"
                                                  v-if="cveRows(selectedAdvisory.references).length">
                                    <q-card>
                                        <q-card-section>
                                            <q-item dense>
                                                <q-table
                                                    :rows="cveRows(selectedAdvisory.references)"
                                                    :columns="cveCol"
                                                    color="primary"
                                                    wrap-cells
                                                    style="width: 100%"
                                                    hide-pagination
                                                    :rows-per-page-options=[0]>
                                                    <template v-slot:body="props">
                                                        <q-tr :props="props">
                                                            <q-td key="cvePublic" :props="props">{{ new Date(props.row.cve.public) }}</q-td>
                                                            <q-td key="severity" :props="props"> {{ toCapitalize(props.row.cve.impact) }} </q-td>
                                                            <q-td key="url" :props="props">
                                                                <a :href="props.row.href" target="_blank">{{ props.row.href }}</a>
                                                            </q-td>
                                                            <q-td key="refcvss" :props="props">{{ props.row.cve.cvss3}}</q-td>
                                                        </q-tr>
                                                    </template>
                                                </q-table>
                                            </q-item>
                                        </q-card-section>
                                    </q-card>
                                </q-expansion-item>
                                <q-expansion-item label="Refernces" expand-separator
                                                  icon="shopping_cart" align="left"
                                                  v-if="selectedAdvisory.references.length">
                                    <q-card>
                                        <q-card-section>
                                            <q-item dense>
                                                <q-table
                                                    :rows="selectedAdvisory.references"
                                                    :columns="refCol"
                                                    color="primary"
                                                    wrap-cells
                                                    style="width: 100%"
                                                    hide-pagination
                                                    :rows-per-page-options=[0]>
                                                    <template v-slot:body="props">
                                                        <q-tr :props="props">
                                                            <q-td key="source" :props="props">
                                                                <span v-if="props.row.ref_type.split('.')[1] === 'bugzilla'">{{ toCapitalize(props.row.ref_type.split('.')[1]) }} </span>
                                                                <span v-else>{{ props.row.ref_type.split('.')[1].toUpperCase() }} </span>
                                                            </q-td>
                                                            <q-td key="url" :props="props">
                                                                <a :href="props.row.href" target="_blank">{{ props.row.href }}</a>
                                                            </q-td>
                                                            <q-td key="id" :props="props">{{ props.row.ref_id }}</q-td>
                                                        </q-tr>
                                                    </template>
                                                </q-table>
                                            </q-item>
                                        </q-card-section>
                                    </q-card>
                                </q-expansion-item>
                                <q-expansion-item label="Bugzilla info" expand-separator
                                                  icon="info" align="left"
                                                  v-if="bugzillaRows(selectedAdvisory.references).length">
                                    <q-card>
                                        <q-card-section>
                                            <q-item dense>
                                                <q-table
                                                    :rows="bugzillaRows(selectedAdvisory.references)"
                                                    :columns="bugzillaCol"
                                                    color="primary"
                                                    wrap-cells
                                                    style="width: 100%"
                                                    hide-pagination
                                                    :rows-per-page-options=[0]>
                                                    <template v-slot:body="props">
                                                        <q-tr :props="props">
                                                            <q-td key="id" :props="props">{{ props.row.ref_id }}</q-td>
                                                            <q-td key="url" :props="props">
                                                                <a :href="props.row.href" target="_blank">{{ props.row.href }}</a>
                                                            </q-td>
                                                            <q-td key="title" :props="props">{{ props.row.title}}</q-td>
                                                        </q-tr>
                                                    </template>
                                                </q-table>
                                            </q-item>
                                        </q-card-section>
                                    </q-card>
                                </q-expansion-item>
                            </q-tab-panel>

                            <q-tab-panel name="packages">
                                table
                            </q-tab-panel>
                        </q-tab-panels>
                </q-card-section>
                <q-card-actions align="right">
                    <q-btn no-caps color="green">Save</q-btn>
                    <q-btn no-caps color="primary">Release packages</q-btn>
                </q-card-actions>
            </q-card>
        </div>
        <q-dialog v-model="showTitle">
            <q-card style="width: 550px;">
                <q-card-section>
                    <div class="text-h6">Original Title</div>
                </q-card-section>
                    <q-card-section>
                        <q-field stack-label>
                            <template v-slot:control>
                                <div class="self-center full-width no-outline" tabindex="0"> {{ selectedAdvisory.original_title }} </div>
                            </template>
                        </q-field>
                    </q-card-section>
                <q-card-actions align="right">
                    <q-btn flat text-color="primary" label="Replace" no-caps @click="this.selectedTitle = this.selectedAdvisory.original_title">
                        <q-tooltip>
                            Replace with the original title
                        </q-tooltip>
                    </q-btn>
                    <q-btn v-if="selectedAdvisory.title && selectedAdvisory.title !== selectedTitle" flat text-color="primary" label="Restore" no-caps @click="this.selectedTitle = this.selectedAdvisory.title">
                        <q-tooltip>
                            Restore title from Data Base
                        </q-tooltip>
                    </q-btn>
                    <q-btn flat text-color="negative" label="Cancel"
                            v-close-popup no-caps/>
                    </q-card-actions>
            </q-card>
        </q-dialog>
        <q-dialog v-model="showDescription" style="max-width: 100%">
            <q-card style="width: 50%; max-width: 100%">
                <q-card-section>
                    <div class="text-h6">Original Description</div>
                </q-card-section>
                    <q-card-section>
                        <q-input
                            v-model="selectedAdvisory.original_description"
                            autogrow
                            readonly
                        />
                    </q-card-section>
                <q-card-actions align="right">
                    <q-btn v-if="selectedAdvisory.description && selectedAdvisory.description !== selectedDescription" flat text-color="primary" label="Restore" no-caps @click="this.selectedDescription = this.selectedAdvisory.description">
                        <q-tooltip>
                            Restore description from Data Base
                        </q-tooltip>
                    </q-btn>
                    <q-btn flat text-color="primary" label="Replace" no-caps @click="this.selectedDescription = this.selectedAdvisory.original_description">
                        <q-tooltip>
                            Replace with the original description
                        </q-tooltip>
                    </q-btn>
                    <q-btn flat text-color="negative" label="Cancel"
                            v-close-popup no-caps/>
                    </q-card-actions>
            </q-card>
        </q-dialog>
    </div>
</template>

<script>
import { defineComponent, ref } from 'vue'

export default defineComponent({
  data () {
    return {
        bulletinTitle: '',
        tab: ref('patchInfo'),
        id: '',
        cveId: '',
        platform: null,
        loading: false,
        totalPages: ref(1),
        selectedAdvisory: null,
        selectedDescription: '',
        showDescription: false,
        descriptionWarn: false,
        selectedTitle: '',
        showTitle: false,
        titleWarn: false,
        columns: [ {
            name: 'updated_date',
            required: true,
            label: 'Update date',
            align: 'left',
            field: 'updated_date',
            headerStyle: 'width: 120px',
        },
        { name: 'id', required: true, align: 'left', label: 'ID', field: 'id'},
        { name: 'original_title', required: true, align: 'left', label: 'Bulletin title', field: 'original_title' }],
        advisors: null,
        refCol: [{ name: 'source', required: true, align: 'left', label: 'Reference source', field: 'source'},
            { name: 'url', required: true, align: 'left', label: 'Reference URL', field: 'url', style: 'word-break: break-word;' },
            { name: 'id', required: true, align: 'left', label: 'Reference Id', field: 'id'}],
        cveCol: [{ name: 'cvePublic', required: true, align: 'left', label: 'CVE public', field: 'cvePublic'},
            { name: 'severity', required: true, align: 'left', label: 'Severity', field: 'severity' },
            { name: 'url', required: true, align: 'left', label: 'URL', field: 'url', style: 'width: 190px; word-break: break-word;',},
            { name: 'refcvss', required: true, align: 'left', label: 'Ref CVSS3', field: 'refcvss', style: 'width: 230px; word-break: break-word;', }],
        bugzillaCol: [{ name: 'id', required: true, align: 'left', label: 'Bugzilla ID', field: 'id'},
            { name: 'url', required: true, align: 'left', label: 'Ticket URL', field: 'url', style: 'word-break: break-word;' },
            { name: 'title', required: true, align: 'left', label: 'Title', field: 'title'}],
        selected: []
    }
  },
  computed: {
    platforms () {
        return this.$store.state.platforms.platforms.map(platform => {
            return {label: platform.name, value: platform.id }
        })
    },
    errataPageNumber () {
            return this.$store.getters['errataFeed/errataPageNumber']
        },
    currentPage: {
        get () { return this.$store.state.errataFeed.pageNumber },
        set (value) {
            this.loading = true
            this.$store.commit('errataFeed/setPageNumber', value)
            this.searchErrata()
        }
    }
  },
  methods: {
    searchErrata () {
        let query = {
            title: this.bulletinTitle,
            platformId: this.platform.value,
            id: this.id,
            cveId: this.cveId,
            pageNumber: this.errataPageNumber
        }
        this.loadAdvisors(query)
    },
    loadAdvisors (query) {
        this.loading = true
        this.$api.get(`/errata/query`, {params: query})
        .then(response => {
            this.loading = false
            console.log(response.data)
            this.advisors = response.data.records
            this.totalPages = Math.ceil(response.data['total_records'] / 10)
          })
        .catch(error => {
            Notify.create({
                message: 'Something went wrong',
                type: 'negative',
                actions: [
                    { label: 'Dismiss', color: 'white', handler: () => {} }
                ]
            })
        })
    },
    loadAdvisory (id) {
        let query = { errata_id: id }
        this.$api.get(`/errata`, {params: query})
        .then(response => {
            console.log(response.data)
            this.selectedAdvisory = response.data
            this.selectedDescription = this.selectedAdvisory.description ? this.selectedAdvisory.description : this.selectedAdvisory.original_description
            this.descriptionWarn = this.selectedAdvisory.description && this.selectedAdvisory.description !== this.selectedAdvisory.original_description
            this.selectedTitle = this.selectedAdvisory.title ? this.selectedAdvisory.title : this.selectedAdvisory.original_title
            this.titleWarn = this.selectedAdvisory.title && this.selectedAdvisory.title !== this.selectedAdvisory.original_title
          })
        .catch(error => {
          Notify.create({
                message: `Failed to load advisory with id: ${id}`,
                type: 'negative',
                actions: [
                    { label: 'Dismiss', color: 'white', handler: () => {} }
                ]
            })
        })
    },
    cveRows (refs) {
        return refs.filter(ref => ref.cve)
    },
    bugzillaRows (refs) {
        return refs.filter(ref => ref.ref_type.split('.')[1] === 'bugzilla')
    },
    markAdvisory (id) {
        if (this.selectedAdvisory) return this.selectedAdvisory.id === id ? 'bg-grey-4' : ''       
    },
    toCapitalize (str) {
        return str.charAt(0).toUpperCase() + str.slice(1)
    }
  }
})
</script>

<style scoped>
</style>
