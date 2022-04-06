<template>
  <q-dialog position="top" v-model="opened" full-height full-width>
        <q-card style="max-width: 1400px;">
            <q-form>
                <q-card-section class="bg-primary shadow-2">
                    <div class="text-h6 text-white" style="text-align: center;">Release info</div>
                </q-card-section>
                <q-card-section style="max-width: 1300px; margin-left: auto; margin-right: auto;">
                    <q-tabs
                        v-model="tab"
                        class="text-primary"      
                    >
                        <q-tab  name="summary" label="Summary" />
                        <q-tab  name="errata" label="Errata/OVAL" />
                        <q-tab  name="pack_list" label="Packages list"/>
                        <q-tab  name="logs" label="Release Logs" />
                    </q-tabs>

                    <q-tab-panels v-model="tab" animated>
                        <q-tab-panel name="summary">
                            <div class="q-pa-md" style="max-width: 900px; margin-left: auto; margin-right: auto;">
                                <q-markup-table>
                                    
                                <thead>
                                    <tr>
                                        <th class="text-left">Platform</th>
                                        <th class="text-left">Status</th>
                                        <th class="text-left">Publication urls
                                            <div class="q-pr-sm" style="padding-top: 5px; position: absolute; right: 0; top: 0;" >
                                                <q-btn  @click="commitRelease"
                                                        color="primary"
                                                        v-if="release.status === 1"
                                                        :loading="loading">
                                                    Commit
                                                </q-btn>
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td class="text-left">{{ release.platform.name }}</td>
                                        <td class="text-left">
                                            <q-chip
                                                :color="statusColor(release)"
                                                text-color="white"
                                                dense
                                                class="text-weight-bolder"
                                                square
                                                >{{ releaseStatus.text[release.status] }}
                                            </q-chip>
                                        </td>
                                        <td class="text-left">
                                            <a class="row" v-for="url in publicationUrls()" :key="url" :href="url">
                                                {{url}}
                                            </a>
                                        </td>
                                    </tr>
                                </tbody>
                                </q-markup-table>
                            </div>
                        </q-tab-panel>

                        <q-tab-panel name="errata">
                            <div class="text-h6">Errata/OVAL</div>
                            Lorem ipsum dolor sit amet consectetur adipisicing elit.
                        </q-tab-panel>

                        <q-tab-panel name="pack_list" style="max-width: 1300px">
                            <q-scroll-area style="height: 500px;">
                                <package-location-selection-form :release="release" :viewOnly="true"/>
                            </q-scroll-area>
                        </q-tab-panel>

                        <q-tab-panel name="logs">
                            <div class="text-h6">Logs</div>
                            {{ release.plan.last_log ? `${release.plan.last_log}`: '' }}
                        </q-tab-panel>

                    </q-tab-panels>
                </q-card-section>

                <q-card-actions align="right">
                    <q-btn flat label="close" color="primary" v-close-popup />
                </q-card-actions>

            </q-form>
        </q-card>
    </q-dialog>

</template>

<script>
import { defineComponent, ref } from 'vue'
import { Notify} from 'quasar'
import { ReleaseStatus } from 'src/constants'
import PackageLocationSelectionForm from 'components/PackageLocationSelectionForm.vue'

export default defineComponent({
    data () {
        return {
            opened: false,
            tab: 'summary',
            release: null,
            releaseStatus: ReleaseStatus,
            loading: false
        }
    },
    methods: {
        open(release) {
            this.release = release
            this.opened = true
        },
        close() {
            this.opened = false
        },
        publicationUrls () {
            let repoUrl = new Set
            let packages = this.release.plan.packages
            if (packages) {
                packages.forEach(pack => {
                    pack.repositories.forEach(repo => {
                        if (repo.url) repoUrl.add(repo.url)
                    })
                });
            }
            return Array.from(repoUrl)
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
        commitRelease () {
            this.loading = true
            this.$api.post(`/releases/${this.release.id}/commit/`)
                .then(response => {
                    this.loading = false
                    if (response.data.release.status === 4){
                        Notify.create({message: response.data.message, type: 'negative',
                            actions: [{ label: 'Dismiss', color: 'white', handler: () => {} }]})
                        this.$router.push(`/release-feed`)
                    } else {
                        Notify.create({message: response.data.message, type: 'positive',
                            actions: [{ label: 'Dismiss', color: 'white', handler: () => {} }]})
                        this.$router.push(`/release-feed`)
                    }
                })
        },
    },
    components: {
        PackageLocationSelectionForm
    }
})
</script>
