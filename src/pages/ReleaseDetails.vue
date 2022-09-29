<template>
    <div class="row justify-center q-col-gutter-sm q-ma-xs q-pl-xl">
        <div style="width: 95%">
            <q-card v-if="release">
                <q-card-section horizontal class="row items-start">
                    <q-card-section class="col q-pt-lg">
                        <div class="text-subtitle2">
                            Created by
                            <a :href="`mailto:${release.owner.email}`">
                                {{ release.owner.username }}
                            </a> <br/>
                            <p v-if="release.created_at">
                                at {{ createdAt(release.created_at) }}
                            </p>
                        </div>
                    </q-card-section>
                    <q-card-section class="col q-pl-xl text-center">
                        <div class="text-h6">
                            Release {{ release.id }}
                        </div>
                        <q-chip align="top" dense
                                    :color="statusColor(release)"
                                    class="text-weight-bolder text-white text-capitalize">
                            {{ statusText(releaseStatus.text[release.status]) }}
                        </q-chip>
                    </q-card-section>
                    <q-card-section class="col q-pt-lg text-center">
                        <div class="row justify-end q-gutter-lg">
                            <div> 
                                <b>Platform:&nbsp;</b> <br/>
                                <span>
                                    {{ release.platform.name }} <br/>
                                </span>
                            </div>
                            <div>
                                <b>Product:&nbsp;</b> <br/>
                                <router-link :to="{path: `/product/${release.product.id}`}">
                                    {{ release.product.name }}
                                </router-link>
                            </div>
                        </div>
                    </q-card-section>
                </q-card-section>
                
                <q-card-section>
                    <release-view :release="release"/>
                </q-card-section>
            </q-card>
        </div>
    </div>
</template>

<script>
    import { Loading, Notify } from 'quasar'
    import { defineComponent, ref } from 'vue'
    import { ReleaseStatus } from 'src/constants'
    import ReleaseView from 'components/ReleaseView.vue'

    export default defineComponent({
    props: {
        releaseId: String
    },
    data() {
        return {
            release: null,
            releaseStatus: ReleaseStatus,
            loadingCommit: false
        }
    },
    created () {
        this.loadRelease(this.releaseId)
    },
    methods: {
        createdAt (date) {
            if (!date) return 'no date'
            
            return new Date(date).toLocaleString()
        },
        statusText(text) {
            return text.replace("release ","")
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
        loadRelease (releaseId) {
            Loading.show()
            this.$api.get(`/releases/${releaseId}/`)
                .then(response => {
                    Loading.hide()
                    this.release = response.data
                })
                .catch(error => {
                    Loading.hide()
                    if (+String(error.response.status)[0] === 4 ){
                        Notify.create({
                            message: error.response.data.detail, type: 'negative',
                            actions: [{ label: 'Dismiss', color: 'white', handler: () => {} }]
                        })
                    } else {
                        Notify.create({
                            message: `${error.response.status}: ${error.response.statusText}`,
                            type: 'negative',
                            actions: [
                                { label: 'Dismiss', color: 'white', handler: () => {} }
                            ]
                        })
                    }
                })
        },
        commitRelease () {
            this.loadingCommit = true
            this.$api.post(`/releases/${this.release.id}/commit/`)
                .then(response => {
                    this.loadingCommit = false
                    Notify.create({message: response.data.message, type: 'positive',
                        actions: [{ label: 'Dismiss', color: 'white', handler: () => {} }]})
                    this.$router.push(`/release-feed`)
                })
                .catch(error => {
                    this.loadingCommit = false
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
    },
    components: {
        ReleaseView
    }
})
</script>

<style>

</style>
