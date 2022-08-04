<template>
    <q-stepper
    v-model="currentStep"
    ref="Releaser"
    color="primary"
    flat
    style="margin-top: -90px"
    >
        <q-step
            name="buildSelection"
            style="min-height: 200px;"
            title="Build selector"
        >    
            <build-selection-form :releaseBuilds="builds" :releasePlatform="platform" :releaseId="releaseId" :releseProduct="product"
                                    @saveState="saveState" @nextStep="onPackagesLocationSelector"/>
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
import { Notify } from 'quasar'
import BuildSelectionForm from 'components/BuildSelectionForm.vue'
import PackageLocationSelectionForm from 'components/PackageLocationSelectionForm.vue'

export default defineComponent({
    data() {
        return {
            builds: [],
            platform: null,
            product: null,
            releaseId: null,
            currentStep: 'buildSelection',
            plan: null
        }
    },
    methods: {
        onPackagesLocationSelector (request_body) {
            this.$refs.Releaser.next()
            this.releaseId ? this.updateRelease(request_body) : this.createRelease(request_body)     
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
            this.$api.put(`/releases/${this.releaseId}/`, request_body)
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
                this.releaseId = this.$refs.packageLocationSelectionForm.releaseId
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
