<template>
  <q-dialog position="top" v-model="opened" full-height style="max-width: 1500px;">
        <q-card style="max-width: 1000px;">
            <q-form>
                <q-card-section class="bg-primary shadow-2">
                    <div class="text-h6 text-white" style="text-align: center;">Module info</div>
                </q-card-section>
                <q-card-section style="max-width: 1000px; margin-left: auto; margin-right: auto;">
                    <q-tabs
                        v-model="tab"
                        class="text-primary"
                        style="width: 750px;"
                    >
                        <q-tab style="width: 300px;" name="info" label="Info" />
                        <q-tab style="width: 300px;" name="yaml" label="Yaml" />
                    </q-tabs>

                    <q-tab-panels v-model="tab" animated>
                        <q-tab-panel name="info">
                            <div class="text-h6">There will be information about modules</div>
                            <project-selector :buildItems="tasks"
                                                @change="value => { tasks = value }"/>
                        </q-tab-panel>

                        <q-tab-panel name="yaml">
                            <div class="text-h6">Yaml</div>
                            Lorem ipsum dolor sit amet consectetur adipisicing elit.
                        </q-tab-panel>
                    </q-tab-panels>
                </q-card-section>

            </q-form>
        </q-card>
    </q-dialog>

</template>

<script>
import { defineComponent, ref } from 'vue'
import ProjectSelector from 'components/ProjectSelector.vue'

export default defineComponent({
    data () {
        return {
            opened: false,
            tab: ref('info'),
            tasks: []
        }
    },
    methods: {
        open() {
            this.opened = true
        },
        close() {
            this.opened = false
        },
    },
    components: {
        ProjectSelector
    }
})
</script>
