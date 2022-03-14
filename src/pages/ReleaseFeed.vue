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
                            <span class="text-weight-small text-primary">{{project.name}}</span>
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
        }
    },
    created () {
        this.loadFeedPage()
    },
    methods: {
        onReleaseView (release) {
            this.$refs.releaseView.open(release)
        },
        loadFeedPage () {
            this.loading = true
            this.$api.get(`/releases/`)
                .then(response => {
                    this.loading = false
                    this.releases = response.data.reverse()
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
                if (pack.packages){ return }
                if (pack.package.arch === 'src') {
                    packages.push({name: pack.package.name, version: pack.package.version, release: pack.package.release})
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
