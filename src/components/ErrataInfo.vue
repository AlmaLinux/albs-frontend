<template>
    <div v-if="advisory">
        <q-card>
            <q-card-section class="row q-gutter-md" style="max-width: 100%">
                <q-field label="Platform" stack-label class="col">
                    <template v-slot:control>
                        <div class="self-center full-width no-outline" tabindex="0">
                            {{ platformName(advisory.platform_id) }}
                        </div>
                    </template>
                </q-field>
                <q-field label="Definitive version" class="col" stack-label >
                    <template v-slot:control>
                        <div class="self-center full-width no-outline" tabindex="0">
                            {{ advisory.definition_version }}
                        </div>
                    </template>
                </q-field>
                <q-field label="Issued Date" class="col" stack-label>
                    <template v-slot:control>
                        <div class="self-center full-width no-outline" tabindex="0">
                            {{ formatDate(advisory.issued_date) }}
                        </div>
                    </template>
                </q-field>
                <q-field label="Updated Date" class="col" stack-label>
                    <template v-slot:control>
                        <div class="self-center full-width no-outline" tabindex="0">
                            {{ formatDate(advisory.updated_date) }}
                        </div>
                    </template>
                </q-field>
            </q-card-section>
            <q-card-section class="q-gutter-md" style="max-width: 100%">
                <q-input v-model="title" label="Bulletin title">
                    <template v-slot:append>
                        <q-btn v-if="titleWarn(advisory.title)" round dense flat color="warning" icon="warning" @click="showTitle = true">
                            <q-tooltip>
                                Bulletin title in Pulp and ALBS DB is different.<br>Click to show the original title
                            </q-tooltip>
                        </q-btn>
                    </template>
                </q-input>
                <q-input type="textarea" input-style="height: 250px"
                            v-model="description" label="Description">
                    <template v-slot:append>
                        <q-btn v-if="descriptionWarn(advisory.description)" round dense flat color="warning" icon="warning" @click="showDescription = true">
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
                                                v-if="cveRows(advisory.references).length">
                                <q-card>
                                    <q-card-section>
                                        <q-item dense>
                                            <q-table
                                                :rows="cveRows(advisory.references)"
                                                :columns="cveCol"
                                                color="primary"
                                                wrap-cells
                                                flat
                                                style="width: 100%"
                                                hide-pagination
                                                :rows-per-page-options=[0]>
                                                <template v-slot:body="props">
                                                    <q-tr :props="props">
                                                        <q-td key="cvePublic" :props="props">{{ formatDate(props.row.cve.public) }}</q-td>
                                                        <q-td key="severity" :props="props">{{ toCapitalize(props.row.cve.impact) }}</q-td>
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
                                                v-if="advisory.references.length">
                                <q-card>
                                    <q-card-section>
                                        <q-item dense>
                                            <q-table
                                                :rows="advisory.references"
                                                :columns="refCol"
                                                color="primary"
                                                wrap-cells
                                                flat
                                                style="width: 100%"
                                                hide-pagination
                                                :rows-per-page-options=[0]>
                                                <template v-slot:body="props">
                                                    <q-tr :props="props">
                                                        <q-td key="source" :props="props">
                                                            <span v-if="props.row.ref_type.split('.')[1] === 'bugzilla'">
                                                                {{ toCapitalize(props.row.ref_type.split('.')[1]) }}
                                                            </span>
                                                            <span v-else>
                                                                {{ props.row.ref_type.split('.')[1].toUpperCase() }}
                                                            </span>
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
                                                v-if="bugzillaRows(advisory.references).length">
                                <q-card>
                                    <q-card-section>
                                        <q-item dense>
                                            <q-table
                                                :rows="bugzillaRows(advisory.references)"
                                                :columns="bugzillaCol"
                                                color="primary"
                                                wrap-cells
                                                flat
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
                            <q-table
                                :rows="[{rhelPack: 'name', almaPack:'build:name', status: 'Locked'}]"
                                :columns="patchInfoCol"
                                selection="multiple"
                                v-model:selected="selected"
                                hide-pagination
                                :rows-per-page-options=[0]>

                                <template v-slot:body="props">
                                    <q-tr :props="props" no-hover>
                                        <q-td colspan="100%">
                                            <div class="text-left"> SRPM: abc BUILD: 123 </div>
                                        </q-td>
                                    </q-tr>
                                    <q-tr :props="props">
                                        <q-td>
                                            <q-checkbox v-model="props.selected" />
                                        </q-td>
                                        <q-td
                                            v-for="col in props.cols"
                                            :key="col.name"
                                            :props="props"
                                        >
                                            {{ col.value }}
                                        </q-td>
                                    </q-tr>
                                </template>

                                <template v-slot:body-selection="scope">
                                    <q-toggle v-model="scope.selected" />
                                </template>

                                <template v-slot:bottom>
                                    <div class="row justify-between" style="width: 100%">
                                        <div class="column items-start">
                                            <div class="q-gutter-md col">
                                                <q-btn dense round no-caps icon="compare_arrows" color="blue-grey-8">
                                                    <q-tooltip>
                                                        Associate packages
                                                    </q-tooltip>
                                                </q-btn>
                                                <q-btn dense round push no-caps icon="add" color="primary">
                                                    <q-tooltip>
                                                        Add package
                                                    </q-tooltip>
                                                </q-btn>
                                            </div>
                                        </div>

                                    <div class="column items-end">
                                        <div class="q-gutter-md col">
                                            <q-btn size="100%" no-caps icon="redo" color="red-8"> Skip </q-btn>
                                            <q-btn size="100%" no-caps icon="lightbulb_outline" color="orange-14"> Proposed </q-btn>
                                            <q-btn size="100%" no-caps icon="done" color="green-8"> Approve </q-btn>
                                        </div>
                                    </div>
                                    </div>
                                </template>
                            </q-table>
                        </q-tab-panel>
                    </q-tab-panels>
            </q-card-section>
            <q-card-actions align="right">
                <q-btn no-caps color="primary" @click="toRelease()">Release packages</q-btn>
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
                                <div class="self-center full-width no-outline" tabindex="0"> {{ advisory.original_title }} </div>
                            </template>
                        </q-field>
                    </q-card-section>
                <q-card-actions align="right">
                    <q-btn
                        flat
                        text-color="primary"
                        label="Replace"
                        no-caps
                        @click="this.title = this.advisory.original_title">
                        <q-tooltip>
                            Replace with the original title
                        </q-tooltip>
                    </q-btn>
                    <q-btn
                        v-if="advisory.title && advisory.title !== title"
                        flat
                        text-color="primary"
                        label="Restore"
                        no-caps
                        @click="this.title = this.advisory.title">
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
                            v-model="advisory.original_description"
                            autogrow
                            readonly
                        />
                    </q-card-section>
                <q-card-actions align="right">
                    <q-btn
                        v-if="advisory.description && advisory.description !== description"
                        flat
                        text-color="primary"
                        label="Restore"
                        no-caps
                        @click="this.description = this.advisory.description">
                        <q-tooltip>
                            Restore description from Data Base
                        </q-tooltip>
                    </q-btn>
                    <q-btn
                        flat
                        text-color="primary"
                        label="Replace"
                        no-caps
                        @click="this.description = this.advisory.original_description">
                        <q-tooltip>
                            Replace with the original description
                        </q-tooltip>
                    </q-btn>
                    <q-btn flat text-color="negative" label="Cancel"
                            v-close-popup no-caps/>
                    </q-card-actions>
            </q-card>
        </q-dialog>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { Notify } from 'quasar'

export default defineComponent({
    name: 'errata-info',
    props: {
        platforms: Array
    },
    data () {
        return {
            advisory: null,
            tab: ref('patchInfo'),
            loading: false,
            description: '',
            showDescription: false,
            title: '',
            showTitle: false,
            refCol: [
                { name: 'source', required: true, align: 'left', label: 'Reference source', field: 'source'},
                { name: 'url', required: true, align: 'left', label: 'Reference URL', field: 'url', style: 'word-break: break-word;' },
                { name: 'id', required: true, align: 'left', label: 'Reference Id', field: 'id'}],
            cveCol: [
                { name: 'cvePublic', required: true, align: 'left', label: 'CVE public', field: 'cvePublic'},
                { name: 'severity', required: true, align: 'left', label: 'Severity', field: 'severity' },
                { name: 'url', required: true, align: 'left', label: 'URL', field: 'url', style: 'word-break: break-word;',},
                { name: 'refcvss', required: true, align: 'left', label: 'Ref CVSS3', field: 'refcvss', style: 'width: 230px; word-break: break-word;', }],
            bugzillaCol: [
                { name: 'id', required: true, align: 'left', label: 'Bugzilla ID', field: 'id'},
                { name: 'url', required: true, align: 'left', label: 'Ticket URL', field: 'url', style: 'word-break: break-word;' },
                { name: 'title', required: true, align: 'left', label: 'Title', field: 'title'}],
            patchInfoCol: [
                { name: 'rhelPack', required: true, align: 'left', label: 'RHEL Package', field: 'rhelPack'},
                { name: 'almaPack', required: true, align: 'left', label: 'Alma Package', field: 'almaPack' },
                { name: 'status', required: true, align: 'left', label: 'Status', field: 'status'}
            ],
            selected: []
        }      
    },
    methods: {
        open (advisory) {
            this.advisory = advisory
            this.description = this.advisory.description ? this.advisory.description : this.advisory.original_description
            this.title = this.advisory.title ? this.advisory.title : this.advisory.original_title
        },
        titleWarn (title) {
            return title && title !== this.advisory.original_title
        },
        descriptionWarn (description) {
            return description && description !== this.advisory.original_description
        },
        platformName (id) {
            return this.platforms.find(platform => platform.value == id).label
        },
        cveRows (refs) {
            return refs.filter(ref => ref.cve)
        },
        bugzillaRows (refs) {
            return refs.filter(ref => ref.ref_type.split('.')[1] === 'bugzilla')
        },
        formatDate (date) {
            const longEnUSFormatter = new Intl.DateTimeFormat('en-US', {
                year:  'numeric',
                month: 'long',
                day:   'numeric',
            })
            return longEnUSFormatter.format(new Date(date))
        },
        toCapitalize (str) {
            return str.charAt(0).toUpperCase() + str.slice(1)
        },
        toRelease () {
            console.log('kek')
        }
    }
})
</script>
