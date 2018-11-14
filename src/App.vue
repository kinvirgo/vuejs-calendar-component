<template>
<div id="app">
    <h2>日历插件</h2>
    <p @click="selectStartDate">去程日期：{{ startDate && startDate.format() }}</p>
    <div class="calendar-container">
        <Calendar ref="myStartCalendar" v-model="startDate" :option="startConfig"></Calendar>
    </div>
    <p @click="selectEndDate">回程日期：{{ endDate && endDate.format() }}</p>
    <div class="calendar-container">
        <Calendar ref="myEndCalendar" v-model="endDate" :option="endConfig"></Calendar>
    </div>
</div>
</template>

<script>
// import Calendar from './component/calendar.vue'
require('./util');
// import Calendar from './component/calendar.alpha.1.vue'
import Calendar from './component/calendar.beta.0.vue'
export default {
    name: 'app',
    data() {
        const _this = this;
        return {
            startDate: null,
            endDate: null,
            startConfig: {
                minDate: new Date(),
                maxDate: new Date(2019, 10, 13),
                weekStart: 1,
            },
            endConfig: {
                minDate: new Date(),
                maxDate: new Date(2019, 10, 13),
                weekStart: 1,
            },
            // 范围日期[开始日期, 结束日期]如果没有就为null
            range : [_this.startDate, _this.endDate]
        }
    },
    mounted() {
        this.selectStartDate();
    },
    components: {
        Calendar
    },
    methods: {
        selectStartDate() {
            var _this = this;
            //render(定位日期,[开始日期,结束日期])
            // 定位日期 > [开始日期,结束日期] > 今天日期
            this.$refs.myStartCalendar.render(this.startDate, this.range).then((date) => {
                // 开始日期
                // _this.endConfig.minDate = date;
                this.range[0] = date;

                const {range}=this;
                if(!!range[1] && date.getTime() > range[1].getTime()){
                    this.range[1] = null;
                    this.endDate = null;
                }
            });
        },
        selectEndDate() {
            var _this = this;
            //render(定位日期,[开始日期,结束日期])
            this.$refs.myEndCalendar.render(this.endDate, this.range).then((date) => {
                // 结束日期
                // _this.startConfig.maxDate = date;

                this.range[1] = date;

                const {range}=this;
                if(!!range[0] && date.getTime() < range[0].getTime()){
                    this.range[1] = this.range[0];
                    this.endDate = this.range[0];

                    this.range[0] = date;
                    this.startDate = date;


                }
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
