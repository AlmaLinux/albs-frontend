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
                <q-markup-table flat>
                    
                <thead>
                    <tr>
                        <th class="text-left">Name</th>
                        <th class="text-left">Arch</th>
                        <th class="text-center">Url</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="repo in publicationUrls()" :key="repo.id">
                        <td class="text-left">{{ repo.name }}</td>
                        <td class="text-left">{{ repo.arch }}</td>
                        <td class="text-center">
                            <a :href="repo.url">
                                {{repo.url}}
                            </a>
                        </td>
                    </tr>
                </tbody>
                </q-markup-table>
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
            loading: false
        }
    },
    methods: {
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
            return repos
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
