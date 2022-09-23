<template>
    <q-tabs
        v-model="tab"
        dense
        class="text-grey"
        active-color="primary"
        indicator-color="primary"
        align="justify"
        narrow-indicator
    >
        <q-tab  name="urls" label="Publication urls" icon="cloud_sync"/>
        <!-- <q-tab  name="errata" label="Errata/OVAL" /> -->
        <q-tab  name="pack_list" label="Packages list" icon="toc"/>
        <q-tab  name="logs" label="Logs" icon="sticky_note_2"/>
    </q-tabs>

    <q-tab-panels v-model="tab" animated style="width: 100%; height: 100%;">
        <q-tab-panel name="urls">
            <div class="q-pa-md" style="max-width: 90%; margin-left: auto; margin-right: auto;">
                <q-table
                    :rows="publicationUrls()"
                    :columns="columns"
                    flat
                    hide-pagination
                    :rows-per-page-options=[0]>
                    <template v-slot:body="props">
                        <q-tr :props="props">
                            <q-td key="name" :props="props">
                                {{ props.row.name }}
                            </q-td>
                            <q-td key="arch" :props="props">
                                {{ props.row.arch }}
                            </q-td>
                            <q-td key="name" :props="props">
                                <a :href="props.row.url">
                                    {{ props.row.url }}
                                </a>
                            </q-td>
                            <q-td key="debug" :props="props">
                                {{ debugValue(props.row.debug) }}
                            </q-td>
                        </q-tr>
                    </template>
                </q-table>
            </div>
        </q-tab-panel>

        <!-- <q-tab-panel name="errata">
            <div class="text-h6">Errata/OVAL</div>
            Lorem ipsum dolor sit amet consectetur adipisicing elit.
        </q-tab-panel> -->

        <q-tab-panel name="pack_list" style="max-width: 100%;">  
            <package-location-selection-form :release="release" :viewOnly="true"/>
        </q-tab-panel>

        <q-tab-panel name="logs">
            <div class="row justify-center q-pt-none log-container">
                <pre>
                    {{ release.plan.last_log ? `${release.plan.last_log}`: "This release hasn't produced any logs yet" }}
                </pre>
            </div>
        </q-tab-panel>

    </q-tab-panels>
</template>

<script>
import { defineComponent, ref } from 'vue'
import PackageLocationSelectionForm from 'components/PackageLocationSelectionForm.vue'

export default defineComponent({
    props: {
        release: Object,
    },
    data () {
        return {
            opened: false,
            tab: ref('urls'),
            loading: false,
            columns: [
                { name: 'name', required: true, align: 'left', label: 'Name', field: 'name', sortable: true },
                { name: 'arch', required: true, align: 'left', label: 'Arch', field: 'arch', sortable: true },
                { name: 'url', required: true, align: 'left', label: 'URL', field: 'url' },
                { name: 'debug', required: true, align: 'left', label: 'Debug', field: 'debug', sortable: true }
            ]
        }
    },
    methods: {
        debugValue (value) {
            return value ? 'Yes' : 'No'
        },
        publicationUrls () {
            let repoUrl = new Set
            let repos = []
            let packages = this.release.plan.packages
            if (packages) {
                packages.forEach(pack => {
                    pack.repositories.forEach(repo => {
                        if (repo.url && !repoUrl.has(repo.url)){
                            repos.push(repo)
                            repoUrl.add(repo.url)
                        }
                    })
                });
            }
            return repos.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0) )
        }
    },
    components: {
        PackageLocationSelectionForm
    }
})
</script>

<style scoped>
  .log-container {
    font-size: small;
    overflow-y: auto;
    padding-left: 2em;
    background-color: #f5f8fa !important;
  }

  .log-container pre {
    white-space: pre-line;
    word-break: break-all;
    color: #0c5176 !important;
    font-family: Consolas,Monaco,Andale Mono,Ubuntu Mono,monospace;
    text-align: left;
  }
</style>
