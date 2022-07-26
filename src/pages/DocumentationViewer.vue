<template>
  <div v-html="markdown" class="castor-doc layout-padding"/>
</template>

<script>
  import { Notify } from 'quasar'

  export default {
    props: {
      article: String,
      chapter: String
    },
    data () {
        return { 
            markdown: '' 
        }
    },
    created () {
      this.renderArticle(this.chapter, this.article)
    },
    beforeRouteUpdate (to, from, next) {
      this.renderArticle(to.params.chapter, to.params.article)
        .then(() => { next() })
        .catch(() => { next() })
    },
    methods: {
      renderArticle (chapter, article) {
        this.$api.get(`/docs/document/${chapter}/${article}`)
            .then(response => {
                this.markdown = response.data
            })
            .catch(error => {
                Notify.create({
                    message: `${error.response.status}: ${error.response.statusText}`,
                    type: 'negative',
                    actions: [
                        { label: 'Dismiss', color: 'white', handler: () => {} }
                    ]
                })
            })
      }
    }
  }
</script>

<style scoped>
  .castor-doc {
    padding: 0 2vw 2vw 2vw;
    overflow: auto;
  }

  .castor-doc >>> h1 {
    font-size: 3.5rem;
    font-weight: 400;
  }

  .castor-doc >>> h2 {
    font-size: 3rem;
  }

  .castor-doc >>> h3 {
    font-size: 2.5rem;
  }

  .castor-doc >>> h4 {
    font-size: 2rem;
  }

  .castor-doc >>> h5 {
    font-size: 1.5rem;
  }
</style>
