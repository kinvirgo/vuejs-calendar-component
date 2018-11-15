<template>
<div id="app">
    <h2>日历插件</h2>
    <p @click="selectStartDate">去程日期：{{ startDate && startDate.format() }}</p>
    <p @click="selectEndDate">回程日期：{{ endDate && endDate.format() }}</p>
</div>
</template>

<script>
require('./util');
export default {
    name: 'app',
    data() {
        const _this = this;
        return {
            startDate: null,
            endDate: null,
            // 范围日期[开始日期, 结束日期]如果没有就为null
            range : [_this.startDate, _this.endDate]
        }
    },
    mounted() {
        let Cal = this.$Calendar; //获得Calendar插件
        this.startCalendar = new Cal({
            minDate: new Date(),
            maxDate: new Date(new Date().setFullYear(new Date().getFullYear()+5)),
            week: 1,
        }); //实例一个对象
        this.endCalendar = new Cal({
            minDate: new Date(),
            maxDate: new Date(new Date().setFullYear(new Date().getFullYear()+5)),
            week: 1, //一周星期几开始 0-7[星期日-星期一]
            showPrevNextDate : true,  //上下月是否展示
            language: 'en',
            format : "YYYY MM", //每月月标题格式
            publicWeek: false, //公用周标题
        });
    },
    methods: {
        selectStartDate() {
            const {startCalendar} = this;
            startCalendar.render(this.startDate, this.range).then((date)=>{
                this.startDate = date;
                this.range[0] = date;
                const {range}=this;
                if(!!range[1] && date.getTime() > range[1].getTime()){
                    this.range[1] = null;
                    this.endDate = null;
                }
            });
        },
        selectEndDate() {
            const {endCalendar} = this;
            endCalendar.render(this.endDate, this.range).then((date)=>{
                this.endDate = date;
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
