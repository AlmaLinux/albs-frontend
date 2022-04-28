<template>
  <q-page class="q-px-xl q-pt-md">
      <div >
        <q-markup-table>
            <thead>
                <tr>
                    <th class="text-left">Releaser</th>
                    <th class="text-left">Status</th>
                    <th class="text-left">Packages</th>
                    <th/>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(release, index) in releases" :key="release.id" :class="index % 2 == 0 ? 'bg-grey-2' : null">
                    <td class="text-left">
                        <a :href="`mailto:${release.created_by.email}`"> {{release.created_by.username}} </a>
                    </td>
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
                        <template v-for="project in getProjects(release.plan)" :key="project.name">
                            <router-link v-if="project.buildId" class="text-weight-small cursor-pointer text-primary" :to="{path: `/build/${project.buildId}`}" target="_blank">
                                {{project.name}}
                            </router-link>
                            <span v-else class="text-weight-small text-primary">{{project.name}}</span>
                            <span class="text-grey-8"> #{{project.version}}-{{project.release}}</span>
                            <br/>
                        </template>
                    </td>
                    <td class="text-right">
                        <q-btn class="gt-xs" flat dense round icon="info" @click="onReleaseView(release)" />
                    </td>
                </tr>
            </tbody>
        </q-markup-table>
    </div>
    <div class="q-pa-lg flex flex-center">
      <q-pagination input :max="totalPages" v-model="currentPage" :disable="loading"/>
    </div>
  </q-page>
  <release-view ref="releaseView"/>  
</template>

<script>
import { defineComponent, ref } from 'vue'
import { ReleaseStatus } from 'src/constants'
import ReleaseView from 'components/ReleaseView.vue'

export default defineComponent({
    data() {
        return {
            loading: false,
            releases: [],
            releaseStatus: ReleaseStatus,
            totalPages: ref(1),
        }
    },
    created () {
        this.loadFeedPage()
    },
    computed: {
        releaseFeedQuery () {
            return this.$store.getters['releaseFeed/releaseFeedQuery']
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
        onReleaseView (release) {
            this.$refs.releaseView.open(release)
        },
        loadFeedPage () {
            this.loading = true
            this.$api.get(`/releases/`, {params: this.releaseFeedQuery})
                .then(response => {
                    this.loading = false
                    this.releases = response.data.releases
                    this.totalPages = Math.ceil(response.data['total_releases'] / 10)
                })
            .catch(error => {
                this.loading = false
                // TODO: add error here
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
        getProjects(plan){
            let packages = []
            plan.packages.forEach(pack => {
                if (pack.package.arch === 'src') {
                    let buildId = null
                    if (pack.package.build_id) {
                        buildId = pack.package.build_id
                    }
                    packages.push({name: pack.package.name, version: pack.package.version, release: pack.package.release, buildId: buildId})
                }
            });
            return packages
        },

    },
    components: {
        ReleaseView
    }
})
</script>