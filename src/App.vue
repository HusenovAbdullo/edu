<template>
  <div id="app">
    <!-- <nav>
      <router-link to="/">Test topshirish</router-link> |
      <router-link to="/admin">Admin paneli</router-link>
    </nav> -->
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'App',
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #000000;

  
}

nav a {
  margin: 10px;
  text-decoration: none;
  font-weight: bold;
  color: #42b983;
}

nav a.router-link-exact-active {
  color: #35495e;
}
</style>
