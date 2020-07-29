<template>
  <div id="app">
<TheContractor />
  </div>
</template>

<script>
import TheContractor from './components/TheContractor';

export default {
  name: 'App',

  components: {
    TheContractor,
  },

  data: () => ({
    //
  }),
};
</script>

<style>
#app {
  display: flex;
  align-items: center;
  width:100%;
  justify-content: center;
  height:100vh;
}
</style>
