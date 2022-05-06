<template>
    <div class="q-pl-xl row">
        <div class="q-pa-md">
            <div class="q-gutter-md row items-start" style="max-width:600px">
                <q-select
                    v-model="platform"
                    :options="platforms"
                    label="Platform*"
                    style="width: 250px"
                    clearable
                />

                <q-input v-model="bulletinTitle" label="Bulletin title" style="width: 250px"/>
            </div>
            <div class="q-py-md q-gutter-md row items-start" style="max-width:600px">
                <q-input v-model="id" label="Advisory ID" style="width: 250px"/>

                <q-input v-model="cveId" label="CVE ID" style="width: 250px"/>
            </div>
            <div class="q-pb-md group row justify-end">
                <q-btn @click="searchErrata()" no-caps icon="search" color="primary">
                    Search
                </q-btn>
            </div>
            <q-table
                title="Advisory"
                :rows="advisors"
                :columns="columns"
                color="primary"
                v-model:pagination="pagination"
                binary-state-sort
                wrap-cells style="width: 518px"
                v-if="advisors.length">
                <template v-slot:body="props">
                        <q-tr :props="props" class="cursor-pointer" :class="selectedAdvisory === props.row ? 'bg-grey-4' : ''" @click="this.selectedAdvisory = props.row">
                            <q-td key="updated_date" :props="props">{{ props.row.updated_date }}</q-td>
                            <q-td key="id" :props="props">{{ props.row.id }}</q-td>
                            <q-td key="updated_date" :props="props">{{ props.row.original_title }}</q-td>
                        </q-tr>
                </template>
            </q-table>
        </div>
        <div class="q-pa-md items-start q-gutter-md" v-if="selectedAdvisory">
            <q-card>
                <q-card-section class="row">
                    <q-field label="Platform" stack-label style="width: 150px">
                        <template v-slot:control>
                            <div class="self-center full-width no-outline" tabindex="0">AlmaLinux-8</div>
                        </template>
                    </q-field>
                    <q-field label="Definitive version" class="q-pl-md" stack-label style="width: 250px">
                        <template v-slot:control>
                            <div class="self-center full-width no-outline" tabindex="0">{{selectedAdvisory.definition_version}}</div>
                        </template>
                    </q-field>
                </q-card-section>
                <q-card-section>
                    <q-input v-model="selectedAdvisory.original_title" label="Bulletin title" style="width: 500px"/>
                </q-card-section>
                <q-card-section>
                    <q-input type="textarea" v-model="selectedAdvisory.original_description" label="Description" style="width: 500px"/>
                </q-card-section>
                <q-card-section class="row">
                    <q-field label="Issued Date" class="q-pr-md" stack-label style="width: 140px">
                        <template v-slot:control>
                            <div class="self-center full-width no-outline" tabindex="0">{{selectedAdvisory.issued_date}}</div>
                        </template>
                    </q-field>
                    <q-field label="Updated Date" class="q-pl-md" stack-label style="width: 140px">
                        <template v-slot:control>
                            <div class="self-center full-width no-outline" tabindex="0">{{selectedAdvisory.updated_date}}</div>
                        </template>
                    </q-field>
                </q-card-section>
                <q-tabs
                    v-model="tab"
                    dense
                    class="text-grey"
                    active-color="primary"
                    indicator-color="primary"
                    align="justify"
                    narrow-indicator
                    style="width: 700px"
                    >
                        <q-tab name="packages" label="Packages" />
                        <q-tab name="patchInfo" label="Patch Info" />
                    </q-tabs>

                    <q-separator />

                    <q-tab-panels v-model="tab" animated>
                        <q-tab-panel name="packages">
                            <q-expansion-item label="CVE information" expand-separator
                                              icon="privacy_tip" default-opened>
                                <q-card>
                                    <q-card-section>
                                        <q-item dense>
                                            <q-table
                                                title="CVE information"
                                                :rows="selectedAdvisory.cve"
                                                :columns="cveCol"
                                                color="primary"
                                                wrap-cells
                                                hide-pagination
                                                :rows-per-page-options=[0]>
                                            </q-table>
                                        </q-item>
                                    </q-card-section>
                                </q-card>
                            </q-expansion-item>
                            <q-expansion-item label="Refernces" expand-separator
                          icon="shopping_cart" >
                                <q-card>
                                    <q-card-section>
                                        <q-item>
                                            Refernces
                                        </q-item>
                                    </q-card-section>
                                </q-card>
                            </q-expansion-item>
                            <q-expansion-item label="Bugzilla info" expand-separator
                          icon="info" >
                                <q-card>
                                    <q-card-section>
                                        <q-item>
                                            Bugzilla
                                        </q-item>
                                    </q-card-section>
                                </q-card>
                            </q-expansion-item>
                        </q-tab-panel>

                        <q-tab-panel name="patchInfo">
                            <q-table
                                :rows="[{rhelPack: 'name', almaPack:'build:name', status: 'Locked'}]"
                                :columns="patchInfoCol"
                                selection="multiple"
                                v-model:selected="selected"
                                hide-pagination
                                :rows-per-page-options=[0]>
                            </q-table>
                        </q-tab-panel>
                    </q-tab-panels>
            </q-card>
        </div>
    </div>
</template>

<script>
import { defineComponent, ref } from 'vue'

export default defineComponent({
  data () {
    return {
        bulletinTitle: '',
        tab: ref('packages'),
        id: '',
        cveId: '',
        platform: null,
        pagination: {
            sortBy: 'updated_date',
            descending: true,
            rowsPerPage: 10
        },
        selectedAdvisory: null,
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
        advisors: [],
        cveCol: [{ name: 'cvePublic', required: true, align: 'left', label: 'CVE public', field: 'cvePublic'},
            { name: 'severity', required: true, align: 'left', label: 'Severity', field: 'severity' },
            { name: 'url', required: true, align: 'left', label: 'URL', field: 'url', style: 'width: 190px; word-break: break-word;',},
            { name: 'refcvss', required: true, align: 'left', label: 'Ref CVSS3', field: 'refcvss', style: 'width: 230px; word-break: break-word;', }],
        patchInfoCol: [{ name: 'rhelPack', required: true, align: 'left', label: 'RHEL Package', field: 'rhelPack'},
            { name: 'almaPack', required: true, align: 'left', label: 'Alma Package', field: 'almaPack' },
            { name: 'status', required: true, align: 'left', label: 'Status', field: 'status',}
        ],
        selected: []
    }
  },
  computed: {
    platforms () {
        return this.$store.state.platforms.platforms.map(platform => {
            return {label: platform.name, value: platform.id }
        })
    }
  },
  methods: {
    searchErrata () {
        let query = {
            title: this.bulletinTitle,
            platformId: this.platform.value,
            id: this.id,
            cveId: this.cveId,
            pageNumber: 1
        }
        console.log(query)
        this.loadErrate(query)
    },
    loadErrate (query) {
        this.$api.get(`/errata/query`, {params: query})
        .then(response => {
            console.log(response)
            this.advisors = response.data.records
          })
        .catch(error => {
          // TODO: add error here
        })
    }
  }
})
</script>

<style scoped>
</style>
