<template>
<div id="app">
    <h2>日历插件</h2>
    <p @click="selectStartDate">去程日期：{{ startDate && startDate.format() }}</p>
    <div class="calendar-container">
        <Calendar ref="myStartCalendar" v-model="startDate" :config="startConfig"></Calendar>
    </div>
    <p @click="selectEndDate">回程日期：{{ endDate && endDate.format() }}</p>
    <div class="calendar-container">
        <Calendar ref="myEndCalendar" v-model="endDate" :config="endConfig"></Calendar>
    </div>
</div>
</template>

<script>
// import Calendar from './component/calendar.vue'
require('./util');
import Calendar from './component/calendar.alpha.1.vue'
export default {
    name: 'app',
    data() {
        return {
            startDate: null,
            endDate: null,
            startConfig: {
                minDate: new Date(),
                maxDate: new Date(2019, 10, 9),
                weekStart: 1,
            },
            endConfig: {
                minDate: new Date(),
                maxDate: new Date(2019, 10, 9),
                weekStart: 1,
            },
        }
    },
    mounted() {

    },
    components: {
        Calendar
    },
    methods: {
        selectStartDate() {
            var _this = this;
            this.$refs.myStartCalendar.render(this.startDate).then((date) => {
                // alert(date);
                _this.endConfig.minDate = date;

            });
        },
        selectEndDate() {
            var _this = this;
            this.$refs.myEndCalendar.render(this.endDate).then((date) => {
                // alert(date);
                _this.startConfig.maxDate = date;
            });
        }
    }
}
</script>

<style lang="scss">
// .calendar-container{
//     position: fixed;
//     top: 20%;
//     bottom : 0;
//     left : 0;
//     right :0;
//     z-index: 1000;
//     background: #2762BF;
// }
</style>
