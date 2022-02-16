<template>
    <q-form @submit="submit" >
        <div class="q-pa-lg" style="float: left;">
            <q-select v-model="platform" dense
                        :options="existingDistros" label="Select Platform"
                        :readonly="releaseId ? true : false"
                        clearable  style="width: 220px"
                        transition-show="scale"
                        transition-hide="scale"
                        :rules="[val => !!val || 'Field is required']">
                <template v-slot:option="scope">
                    <q-item v-bind="scope.itemProps">              
                        <q-item-section>
                            <q-item-label class="text-center" v-html="scope.opt.label" ></q-item-label>
                            <q-item-label v-if="scope.opt.description" class="text-center" caption>
                                {{ scope.opt.description }}
                            </q-item-label>
                        </q-item-section>
                    </q-item>
                </template>
            </q-select>
        </div>

        <div class="q-pa-lg" style="float: left;">
            <q-input v-model="textValue" label="Enter Build ID or Build link" style="width: 280px"
                    dense @keydown.enter.prevent="parseBuildId(textValue)">
                <template v-slot:after>
                    <q-btn round dense flat color="primary" icon="add" @click="parseBuildId(textValue)"/>
                </template>
            </q-input>
        </div>

        <div class="q-pa-lg q-gutter-xs" style="position: absolute; right: 0;">
            <q-btn class="shadow-2" color="primary" icon-right="send" label="Submit" type="submit" />
        </div>
    </q-form>

    <div style="width: 100%; float: right">
        <div class="q-pa-md" style="width: 450px; float: left">

            <q-list v-if="builds.length" separator bordered class="rounded-borders shadow-2">

                <q-item-label header>Builds list</q-item-label>

                <q-item v-for="build in builds" :key="build.id" v-ripple clickable style="width: 100%;"
                        :active="activeBuild === build" active-class="bg-grey-4" @click="this.activeBuild = build">

                    <q-item-section avatar middle>
                        <q-icon v-if="build.warning" name="warning" color="orange" size="30px">
                            <q-tooltip anchor="bottom middle" self="top middle" max-width="90px"
                                    transition-show="scale" transition-hide="scale">
                                one or more projects failed for some arch
                            </q-tooltip>
                        </q-icon>
                        
                        <q-icon v-else name="build_circle" color="black" size="30px" />
                    </q-item-section>

                    <q-item-section middle class="col-2">
                        <q-item-label lines="1">
                            <router-link class="q-mt-sm cursor-pointer text-black" :to="{path: `/build/${build.id}`}" target="_blank">
                                Build {{ build.id }}
                            </router-link>
                        </q-item-label>
                    </q-item-section>

                    <q-item-section middle>
                        <q-item-label lines="1">
                            <span> {{`Selected ${build.selected.length} / Total ${build.options.length}`}} </span>
                        </q-item-label>
                    </q-item-section>

                    <q-item-section top side>
                        <div class="text-grey-8 q-gutter-xs">
                            <q-btn class="del-btn" size="15px" flat dense round icon="delete" @click="deleteBuild(build.id)"/>
                        </div>
                    </q-item-section>
                </q-item>

            </q-list>
        </div>

        <div class="q-pa-md" style="width: 450px; float: left">
            <q-list v-if="this.activeBuild" separator bordered class="rounded-borders shadow-2">
                <div class="q-pa-xs">
                    <q-table
                        title="Projects list"
                        :rows="this.activeBuild.options"
                        :columns="columns"
                        row-key="label"
                        hide-header
                        hide-bottom
                        :rows-per-page-options="[0]"
                    >   
                        <template v-slot:top-right>
                            <q-btn round dense flat icon="close" @click="this.activeBuild = null"/>
                        </template>

                        <template v-slot:body="props">
                            <q-tr :props="props">
                                <q-td auto-width>
                                    <q-toggle v-model="props.row.selected" @click="selectProject(activeBuild)"/>
                                </q-td>
                                <q-td key="label" :props="props" >
                                    <build-ref :buildRef="props.row.ref" />
                                </q-td>
                            </q-tr>
                        </template>
                    </q-table>
                </div>
            </q-list>
        </div>
    </div>
</template>

<script>
import { defineComponent } from 'vue'
import { Notify } from 'quasar'
import { BuildStatus } from '../constants.js'
import BuildRef from 'components/BuildRef.vue'

export default defineComponent({
    name: 'build-selection-form',
    props: {
        releaseBuilds: Array,
        releasePlatform: Object,
        releaseId: Number
    },
    emits: ["nextStep", "saveState"],
    data () {
        return {
            builds: this.releaseBuilds,
            uniqueBuildsId: new Set(),
            platform: this.releasePlatform,
            activeBuild: null,
            textValue: null,
            tableselected: [],
            columns : [
  {
    name: 'label',
    required: true,
    label: '',
    align: 'left',
    field: row => row.label,
  }],
        }
    },
    computed: {
        existingDistros () {
            return this.$store.state.platforms.platforms.map(platform => {
                return { label: platform.name, value: platform.name, description: platform.arch_list.join(', '), id: platform.id }
            })
        }
    },
    methods: {
        selectProject (active) {
            active.selected = []
            active.options.forEach( opt =>{
                if (opt.selected) active.selected.push(opt)
            })
        },
        parseBuildId (textValue) {
            if (textValue.match(`${window.origin}/build/`) && textValue.match(/(?<=build\/)\d+/)) {
                this.loadBuildInfo(textValue.match(/(?<=build\/)\d+/)[0])
            }
            else if (parseInt(textValue)) {
                this.loadBuildInfo(textValue)
            }
            else {
                Notify.create({
                    message: 'Invalid Build ID or Build link',
                    type: 'negative',
                    actions: [
                        { label: 'Dismiss', color: 'white', handler: () => {} }
                    ]
                })
            }
        },
        loadBuildInfo (buildId) {
            if (this.uniqueBuildsId.has(+buildId)) {
                Notify.create({
                    message: `Build ${buildId} already added`,
                    type: 'negative',
                    actions: [
                        { label: 'Dismiss', color: 'white', handler: () => {} }
                    ]
                })
                return
            }
            this.$api.get(`/builds/${buildId}/`)
                .then(response => {
                    let build = response.data
                    this.uniqueBuildsId.add(+buildId)
                    
                    let successful = new Set()
                    let failed = new Set()
                    let options = {}
                    let buildRunning = false
                    build.tasks.forEach( task => {
                        switch (task.status) {
                            case BuildStatus.COMPLETED:
                                failed.has(task.index) ? build.warning = true : successful.add(task.index)
                                
                                if (options[task.index]){
                                    options[task.index].ids.push(task.id)
                                } else {
                                    options[task.index] =  {
                                        ids: [task.id],
                                        ref: task.ref,
                                        selected: true
                                    }
                                }
                                break;
                            case BuildStatus.FAILED:
                                failed.add(task.index)

                                if (successful.has(task.index)) {
                                    build.warning = true
                                    options[task.index].selected = false
                                    successful.delete(task.index)
                                } 
                                break;
                            case BuildStatus.EXCLUDED:
                                break;
                            default:
                                buildRunning = true
                        }
                    })
                    if (buildRunning){
                        Notify.create({
                            message: `Build ${buildId} is still running`,
                            type: 'negative',
                            actions: [
                                { label: 'Dismiss', color: 'white', handler: () => {} }
                            ]
                        })
                        this.uniqueBuildsId.delete(+buildId)
                    } else if (Object.keys(options).length === 0 && options.constructor === Object) {
                        Notify.create({
                            message: `Build ${buildId} failed`,
                            type: 'negative',
                            actions: [
                                { label: 'Dismiss', color: 'white', handler: () => {} }
                            ]
                        })
                        this.uniqueBuildsId.delete(+buildId)
                    } else {
                        build.selected = []
                        build.options = []
                        for (const index in options) {
                            let opt = {
                                value: +index,
                                ids: options[index].ids,
                                ref: options[index].ref,
                                selected: options[index].selected
                            }
                            build.options.push(opt)
                            if (opt.selected) build.selected.push(opt)
                        }
                        this.builds.push(build)
                    }
                    this.textValue = ''
                })
                .catch(error => {
                    console.log(error)
                    if (error.response.status === 404) {
                        Notify.create({
                            message: `Build ${buildId} does not exist`,
                            type: 'negative',
                            actions: [
                                { label: 'Dismiss', color: 'white', handler: () => {} }
                            ]
                        })
                    } else {
                        Notify.create({
                            message: 'Invalid Build ID or Build link',
                            type: 'negative',
                            actions: [
                                { label: 'Dismiss', color: 'white', handler: () => {} }
                            ]
                        })
                    }
                })
        },
        deleteBuild (buildId) {
            if (this.activeBuild && this.activeBuild.id === buildId) {
                this.activeBuild = null
            }
            this.builds = this.builds.filter( build => build.id !== buildId)
            this.uniqueBuildsId.delete(+buildId)
            event.stopPropagation()
        },
        submit () {
            let request_body = {
                builds: [],
                build_tasks: [],
                platform_id: this.platform.id,
                reference_platform_id: this.platform.id
            }
            let state = {builds: this.builds, platform: this.platform}
            this.$emit('saveState', state)
            this.builds.map(build => {
                if (!build.selected.length) return

                request_body.builds.push(build.id)
                build.selected.forEach (s => {
                    request_body.build_tasks = request_body.build_tasks.concat(s.ids)
                })
            })
            if (request_body.build_tasks.length) {
                this.$emit('nextStep', request_body)
            } else {
                Notify.create({
                    message: 'Please add builds to release and select projects',
                    type: 'negative',
                    actions: [
                        { label: 'Dismiss', color: 'white', handler: () => {} }
                    ]
                })
            }
        }
    },
    components: {
        BuildRef
    }
})
</script>

<style scoped>
  .del-btn:hover {
      color: #ff4649;
  }
  .q-table__container {
    box-shadow: none;
  }
</style>
