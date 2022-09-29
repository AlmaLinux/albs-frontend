<template>
    <q-stepper
        v-model="currentStep"
        ref="Releaser"
        color="primary"
        flat
        class="q-pl-md"
        style="margin-top: -90px"
    >
        <q-step
            name="buildSelection"
            style="min-height: 200px;"
            title="Build selector"
        >    
            <build-selection-form
                v-if="(releaseId && release_id) || !releaseId"
                :releaseBuilds="builds"
                :releasePlatform="platform"
                :releaseId="release_id"
                :releseProduct="product"
                @saveState="saveState"
                @nextStep="onPackagesLocationSelector"
                ref="buildSelectionForm"
            />
        </q-step>

        <q-step
            name="packageSelection"
            style="min-height: 200px;"
            title="Package location selector"
        >
            <package-location-selection-form ref="packageLocationSelectionForm"/>
        </q-step>
        
        <template v-slot:navigation>
            <q-stepper-navigation class="group justify-end">
                <q-btn @click="onPreviousStep"
                        flat
                        color="primary"
                        v-if="currentStep !== 'buildSelection'">
                    Back 
                </q-btn>  
            </q-stepper-navigation>
        </template>
    </q-stepper>

</template>

<script>
import { defineComponent, ref } from 'vue'
import { Loading, Notify } from 'quasar'
import { getFromApi } from '../utils'
import BuildSelectionForm from 'components/BuildSelectionForm.vue'
import PackageLocationSelectionForm from 'components/PackageLocationSelectionForm.vue'
import { BuildStatus } from 'src/constants'

export default defineComponent({
    props: {
        releaseId: String
    },
    data() {
        return {
            builds: ref([]),
            platform: null,
            product: null,
            release_id: null,
            currentStep: 'buildSelection',
            plan: null
        }
    },
    created() {
        this.getRealese()
    },
    methods: {
        onPackagesLocationSelector (request_body) {
            this.$refs.Releaser.next()
            if (this.releaseId && (request_body.build_tasks === this.release.build_task_ids)) {
                this.$refs.packageLocationSelectionForm.createTable(this.release)
                console.log('lol')
            } else {
                this.release_id ? this.updateRelease(request_body) : this.createRelease(request_body) 
            }
        },
        isSubArray (arr1, arr2 ) {
            let flag = true
            arr2.forEach( a2 => {
                flag = arr1.indexOf(a2) === -1 ? false : true
            })
            return flag
        },
        parseBuilds () {
            this.release.build_ids.forEach(async id => {
                let build = await getFromApi(this.$api, `/builds/${id}`)
                let successful = new Set()
                let failed = new Set()
                let options = {}
                build.tasks.forEach(task => {
                    switch (task.status) {
                        case BuildStatus.COMPLETED:
                            failed.has(task.index) ? build.warning = true : successful.add(task.index)
                            
                            if (options[task.index]){
                                options[task.index].ids.push(task.id)
                            } else {
                                options[task.index] =  {
                                    ids: [task.id],
                                    ref: task.ref
                                }
                            }
                            break;
                        case BuildStatus.FAILED:
                            failed.add(task.index)

                            if (successful.has(task.index)) {
                                build.warning = true
                                successful.delete(task.index)
                            } 
                            break;
                        default:
                            break;
                    }
                })
                build.selected = []
                build.options = []
                for (const index in options) {
                    let opt = {
                        value: +index,
                        ids: options[index].ids,
                        ref: options[index].ref,
                        selected: this.isSubArray(this.release.build_task_ids, options[index].ids)
                    }
                    build.options.push(opt)
                    if (opt.selected) build.selected.push(opt)
                }
                this.$refs.buildSelectionForm.builds.push(build)
            })
        },
        getRealese () {
            if (!this.releaseId) return

            Loading.show()
            this.$api.get(`/releases/${this.releaseId}/`)
                .then(response => {
                    Loading.hide()
                    this.release = response.data
                    this.plan = this.release.plan
                    this.release_id = this.release.id
                    this.platform = {
                        label: this.release.platform.name,
                        value: this.release.platform.name,
                        description: this.release.platform.arch_list.join(', '),
                        id: this.release.platform.id
                    }
                    this.product = {
                        label: this.release.product.name,
                        value: this.release.product.id,
                        description: this.release.product.title
                    }
                    this.parseBuilds()
                })
                .catch(error => {
                    Loading.hide()
                    console.log(error)
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
        createRelease (request_body) {
            this.$api.post(`/releases/new/`, request_body)
                .then(response => {
                    this.$refs.packageLocationSelectionForm.createTable(response.data)
                })
                .catch(error => {
                    console.log(error)
                    Notify.create({
                        message: `${error.response.status}: ${error.response.statusText}`,
                        type: 'negative',
                        actions: [
                            { label: 'Dismiss', color: 'white', handler: () => {} }
                        ]
                    })
                    this.onPreviousStep()
                })
        },
        updateRelease (request_body) {
            request_body.plan = this.plan
            this.$api.put(`/releases/${this.release_id}/`, request_body)
                .then(response => {
                    this.$refs.packageLocationSelectionForm.createTable(response.data)
                })
                .catch(error => {
                    console.log(error)
                    Notify.create({
                        message: `${error.response.status}: ${error.response.statusText}`,
                        type: 'negative',
                        actions: [
                            { label: 'Dismiss', color: 'white', handler: () => {} }
                        ]
                    })
                    this.onPreviousStep()
                }) 
        },
        saveState (state){
            this.builds = state.builds
            this.platform = state.platform
            this.product = state.product
        },
        onNextStep () {
            this.$refs.Releaser.next()
        },
        onPreviousStep() {
            if (this.currentStep === 'packageSelection'){
                this.plan = this.$refs.packageLocationSelectionForm.getPlan()
                this.release_id = this.$refs.packageLocationSelectionForm.releaseId
            }
            this.$refs.Releaser.previous()
        }
    },
    components: {
        BuildSelectionForm,
        PackageLocationSelectionForm
    }
})

</script>
