<template>
<transition name="slide" tag="div">
    <div id="calendar-root" v-show="display">
        <div class="calendar-mask" @click="hide"></div>
        <div class="calendar-section">
            <!-- 统一星期标题 -->
            <ul v-if="!!publicTitle" class="calendar-title">
                <li v-for="(pItem, pIndex) in 7" :key="pIndex" >{{!!i18n && i18n.weekdaysShort[(weekStart+pIndex)%7]}}</li>
            </ul>
            <div class="calendar-lists" :scrollTop.prop="scrollTop" @scroll.passive="onScroll">
                <div class="calendar-table-option" v-for="(item, index) in calendars" :key="index" :id="getAnchor(item.date)" >
                    <div class="calendar-table-title">{{item.date.format("YYYY年MM月")}}</div>
                    <table class="calendar-table">
                        <thead v-if="!publicTitle">
                            <tr>
                                <th v-for="(tItem, tIndex) in 7" :key="tIndex">{{i18n.weekdaysShort[(weekStart+tIndex)%7]}}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(weeksItem, weeksIndex) in item.data" :key="weeksIndex">
                                <template v-for="(dayItem, dayIndex) in weeksItem">
                                    <!-- 有效 -->
                                    <!-- <td :key="dayIndex" v-if="dayItem.isAvailable" @click="select(dayItem.date)" class="available" :class="{
                                        'today' : dayItem.isToday,
                                        'primary' : primaryTime === dayItem.date.getTime()
                                    }">{{dayItem.day}}</td> -->
                                    <td :key="dayIndex" v-if="dayItem.isAvailable" @click="select(dayItem.date)" class="available" :class="createClass(dayItem)" >{{dayItem.day}}</td>
                                    <!-- 无效 -->
                                    <td :key="dayIndex" v-else-if="dayItem.type === 0" class="unavailable">{{ dayItem.type === 0 ? dayItem.day : ''}}</td>
                                    <!-- 上下月 -->
                                    <td :key="dayIndex" v-else :class="{'unavailable':dayItem.type != 0 && option.showPrevNextDate}">{{ dayItem.type != 0 && option.showPrevNextDate ? dayItem.day : ''}}</td>
                                </template>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</transition>
</template>
<script>
// 格式化
Date.prototype.format = function(format) {
    //默认标准格式
    var date = this;
    format = format || 'yyyy-MM-dd';
    var obj = {
        'Y': date.getFullYear(), // 年份，注意必须用getFullYear
        'y': date.getFullYear(), // 年份，注意必须用getFullYear
        'M': date.getMonth() + 1, // 月份，注意是从0-11
        'd': date.getDate(), // 日期
        'q': Math.floor((date.getMonth() + 3) / 3), // 季度
        'w': date.getDay(), // 星期，注意是0-6
        'H': date.getHours(), // 24小时制
        'h': date.getHours() % 12 == 0 ? 12 : date.getHours() % 12, // 12小时制
        'm': date.getMinutes(), // 分钟
        's': date.getSeconds(), // 秒
        'S': date.getMilliseconds() // 毫秒
    };
    var week = ['天', '一', '二', '三', '四', '五', '六'];
    for (var i in obj) {
        format = format.replace(new RegExp(i + '+', 'g'), function(m) {
            var val = obj[i] + '';
            if (i == 'w') return (m.length > 2 ? '星期' : '周') + week[val];
            for (var j = 0, len = val.length; j < m.length - len; j++) val = '0' + val;
            return m.length == 1 ? val : val.substring(val.length - m.length);
        });
    }
    return format;
};
export default {
    name: "Calendar",
    props: {
        // 计划初始化参数统一通过option传入
        config: {
            type: Object,
            default: () => ({}),
            required: false
        }
    },
    data: () => ({
        tag : Math.random().toString(36).substr(2),
        scrollTop : 0,
        minDateTime : null,
        maxDateTime : null,
        display: false,
        // 展示月份数据
        calendars: [],
        //预选值 并不是选中的值
        primaryDate: null,
        // 预选值时间戳
        primaryTime: null,
        // 范围日期
        range : [],
        //公用标题 如果为否则每个月份都带有一个标题
        publicTitle : true,
        // 文案
        i18n : null,
        // 默认配置
        option: {
            showPrevNextDate : false, //上下月是否展示
            minDate: null,
            maxDate: null,
            weekStart: 0,
            language: 'zh',
            view: 3,
            cache: 2, //存日期个数(上下共4个月份)
            publicTitle : true, //公用标题 如果为否则每个月份都带有一个标题
        },
        // 文案
        copywriter: {
            'zh': {
                weekdaysShort: ['日', '一', '二', '三', '四', '五', '六']
            },
            'en': {
                weekdaysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
            }
        }
    }),
    watch: {
        config: {
            // 深度监听
            handler: function(val, oldVal) {
                // 重新初始化
                this.init();
            },
            deep: true
        }
    },
    mounted() {
        // 初始化
        this.init();
    },
    methods: {
        onScroll(e){
            this.scrollTop = e.target.scrollTop;
        },
        getAnchor(date){
            let m = date.getMonth()+1;
            m = m > 9 ? m : `0${m}`;
            return `${this.tag}_${date.getFullYear()}${m}`;
        },
        init() {
            const {
                copywriter,
                option,
                config,
                isType,
                clearTime,
                getTimeOfclearTime
            } = this;
            const opt = { ...option,
                ...config
            };
            this.option = opt;
            console.log(opt);
            // 这时候拿到的option 并不一定全是正确配置 所以要把配置放在this上
            this.minDateTime = getTimeOfclearTime(opt.minDate);
            this.maxDateTime = getTimeOfclearTime(opt.maxDate);
            this.i18n = copywriter[opt.language];
            this.fixDate = new Date();
            this.weekStart = /^[0-6]$/g.test(opt.weekStart) ? opt.weekStart : 0;
            this.view = 13; /*===test===*/
            this.publicTitle = !!opt.publicTitle;
            // this.view =  isType(opt.view, 'Number') && opt.view > 1 && opt.view <6 ? opt.view : 3;
            this.cache = isType(opt.cache, 'Number') && opt.cache > 1 && opt.cache < 4 ? opt.cache : 3;
        },
        changeDate(data) {
            // 改变父组件(v-model)的值
            this.$emit('input', data);
        },
        choose(date) {
            // console.log(date);
            this.primaryVal = date;
            this.primaryTime = this.getTimeOfclearTime(date);
            this.changeDate(date);
            this.hide();
        },
        createClass(data){
            const {range} = this;
            const className = [];
            const currTime = data.date.getTime();
            const rangeStartTime = !!range[0] ? range[0].getTime() : null;
            const rangeEndTime = !!range[1] ? range[1].getTime() : null;
            // 今日
            data.isToday && className.push('today');
            // 选中
            if(currTime === rangeStartTime || currTime === rangeEndTime){
                className.push('primary');
            }
            // 经过
            if(!!rangeStartTime && !!rangeEndTime && currTime > rangeStartTime && currTime < rangeEndTime){
                className.push('range');
            }

            return className;
        },
        render(date, range) {
            return new Promise((resolve, reject) => {
                // 重新渲染清空
                this.calendars = [];
                // 渲染日期
                if (this.isDate(date)) {
                    // this.fixDate = date;
                    this.primaryVal = date;
                    this.primaryTime = this.getTimeOfclearTime(date);
                }
                if(this.isType(range, 'Array')){
                    this.range = range;
                }
                // 每次渲染都重新获取今日时间戳
                this.todayDateTime = this.getTimeOfclearTime(new Date());
                this.getCalendars();
                this.show();
                // 一定要异步否则无效 mounted 无法保证组件全部已经在document中
                setTimeout(()=>{
                    /*if(!!this.primaryVal){
                        let p = document.getElementById( this.getAnchor(this.primaryVal) );
                        this.scrollTop = p.offsetTop || 0;
                    }else{
                        // 最小值
                        let anchorDate = !!this.minDateTime ? new Date(this.minDateTime) : new Date();
                        let p = document.getElementById( this.getAnchor(anchorDate) );
                        this.scrollTop = p.offsetTop || 0;
                    }*/
                    let _range = this.range;
                    if(!!this.primaryVal){
                        // 预选没有值
                        let p = document.getElementById( this.getAnchor(this.primaryVal) );
                        this.scrollTop = p.offsetTop || 0;
                    }else{
                        // 去[回]程判断顺序都是 预选值 -> range[0]->range[1]-minDate
                        let anchorDate = _range[0] || _range[1] || (!!this.minDateTime ? new Date(this.minDateTime) : new Date());
                        let p = document.getElementById( this.getAnchor(anchorDate) );
                        this.scrollTop = p.offsetTop || 0;
                    }
                },50)

                this.select = (date) => {
                    this.choose(date);
                    resolve(date);
                }
            });
        },
        getCalendars() {
            const {
                view,
                fixDate,
                weekStart,
                createDate,
                getMaxDate,
                getDateOfArray
            } = this;
            // 获取需要渲染的日历
            const fixDateArray = getDateOfArray(fixDate);
            // console.log( fixDateArray );
            for (let k = 0, g = view; k < g; k++) {
                let currMonth = (fixDateArray[1] + k) % 12; //当前渲染月份
                let currYear = fixDateArray[0] + parseInt((fixDateArray[1] + k) / 12); //当前渲染年份
                let currViewDate = new Date(currYear, currMonth, 1); //当前渲染月的第一天日期
                let weekdayOfFirstDay = currViewDate.getDay(); //当前渲染view的月份第一天周几
                let daysOfPrevMonth = (weekdayOfFirstDay - weekStart + 7) % 7; //当前渲染view的月份需要上月填补多少天
                let maxDateOfCurrMonth = getMaxDate(currYear, currMonth); //当前渲染view的月份最大天数
                let month = []; //月
                let weeks = []; //周
                let count = 0; //本月第N天(7*6 = 42计算的)
                if (daysOfPrevMonth > 0) {
                    // 上月填补天数
                    let maxDateOfPrevMonth = getMaxDate(currYear, currMonth - 1);
                    for (let i = maxDateOfPrevMonth - daysOfPrevMonth + 1, l = maxDateOfPrevMonth; i <= l; i++) {
                        const currDate = new Date(currYear, currMonth - 1, i); //今天的日期对象
                        const n = createDate(currDate, -1);
                        count++;
                        weeks.push({
                            ...n,
                            type: -1,
                            day: i,
                            date: currDate
                        });
                    }
                }
                // 当前月
                for (let i = 1, l = maxDateOfCurrMonth; i <= l; i++) {
                    const currDate = new Date(currYear, currMonth, i); //今天的日期对象
                    const n = createDate(currDate, 0);
                    weeks.push({
                        ...n,
                        type: 0,
                        day: i,
                        date: currDate
                    });
                    if (++count % 7 === 0) {
                        month.push(weeks);
                        weeks = [];
                    }
                }
                // 下月日期
                if (count % 7 != 0) {

                    for (let i = 1, l = 6 * 7 - count; i <= l; i++) {
                        const currDate = new Date(currYear, currMonth + 1, i); //今天的日期对象
                        const n = createDate(currDate, 1);
                        weeks.push({
                            ...n,
                            type: 1,
                            day: i,
                            date: currDate
                        });
                        if (++count % 7 === 0) {
                            month.push(weeks);
                            // weeks = [];
                            i = 43; //结束循环
                        }
                    }
                }
                this.calendars.push({
                    date: currViewDate,
                    data: month
                })
            }
        },
        createDate(currDate, type) {
            const r = {
                isAvailable: type == 0 || false, // 是否有效(上下月都是无效的)
                isToday: false, //是否是今日
            };
            const {
                minDateTime,
                maxDateTime,
                todayDateTime
            } = this;
            const currDateTime = currDate.getTime();
            // 是否有效
            if ((!!minDateTime && currDateTime < minDateTime) || (!!maxDateTime && currDateTime > maxDateTime)) {
                r.isAvailable = false;
            }
            //是否是今日
            if (currDateTime == todayDateTime) {
                r.isToday = true;
            }
            return r;
        },
        hide() {
            this.display = false;
        },
        show() {
            this.display = true;
        },
        isType(val, type) {
            // 判断val是否是type类型
            return Object.prototype.toString.call(val) === `[object ${type}]`
        },
        isDate(date) {
            // 判断 date是否是 Date类型
            return Object.prototype.toString.call(date) === "[object Date]"
        },
        clearTime(date) {
            // 清楚日期对象时间部分 && 便于后期处理对比
            return this.isDate(date) ? new Date(date.getFullYear(), date.getMonth(), date.getDate()) : null;
        },
        getMaxDate(year, month) {
            // 获取当前年月的最大天数
            return new Date(new Date(year, month + 1, 1).getTime() - 1 * 24 * 60 * 60 * 1000).getDate();
        },
        getDateOfArray(date) {
            // return this.isDate(date) ? [date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()] : [];
            return this.isDate(date) ? [date.getFullYear(), date.getMonth(), date.getDate()] : [null, null, null];
        },
        getTimeOfclearTime(date) {
            // 清楚时间后的时间戳
            return this.isDate(date) ? new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() : null;
        },
    }
}
</script>
<style lang="scss"scoped>
@import './calendar.alpha.2.scss'
</style>
