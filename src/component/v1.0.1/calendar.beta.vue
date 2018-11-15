<template>
<transition name="slide">
    <div v-show="display" class="vc-calendar-root">
        <!-- calendar-mask -->
        <div class="vc-calendar-mask" @click="hide">{{scrollTop}}</div>
        <!-- calendar-section -->
        <div class="vc-calendar-section">
            <!-- 公用星期标题 -->
            <ul v-if="publicWeek" class="vc-calendar-public-title">
                <li v-for="(pItem, pIndex) in 7" :key="pIndex">{{!!i18n && i18n.weekdaysShort[(week+pIndex)%7]}}</li>
            </ul>
            <!-- 日历列表 -->
            <div class="vc-calendar" :class="{'vc-calendar-top': !publicWeek }" :scrollTop.prop="getScrollTop()" @scroll.passive="onScroll">
                <!-- 每月列表 -->
                <div class="vc-calendar-month" v-for="(item, index) in calendars" :key="index" :id="getAnchor(item.date)">
                    <!-- 每月标题 -->
                    <h1 class="vc-calendar-month-title">{{item.date.format(format)}}</h1>
                    <ul v-if="item.loadType === 1" class="vc-calendar-day">
                        <template v-if="!publicWeek">
                            <li v-for="(pwItem, pwIndex) in 7" class="vc-calendar-week-item" :key="`pw-${pwIndex}`">{{!!i18n && i18n.weekdaysShort[(week+pwIndex)%7]}}</li>
                        </template>

                        <template v-for="(dayItem, dayIndex) in item.data">
                            <!-- 有效 -->
                            <li v-if="dayItem.isAvailable" class="vc-calendar-day-item" :key="dayIndex" :class="createClass(dayItem)" @click="select(dayItem.date)">{{dayItem.day}}</li>
                            <!-- 无效 -->
                            <li v-else-if="dayItem.type === 0" class="vc-calendar-day-item unavailable" :key="dayIndex">{{ dayItem.type === 0 ? dayItem.day : ''}}</li>
                            <!-- 上下月 -->
                            <li v-else class="vc-calendar-day-item" :class="{'unavailable':dayItem.type != 0 && showPrevNextDate}" :key="dayIndex">{{ dayItem.type != 0 && showPrevNextDate ? dayItem.day : ''}}</li>
                        </template>
                    </ul>
                    <!-- 加载中状态 -->
                    <div v-else-if="item.loadType === 0" class="vc-calendar-month-loading">
                        <h1>加载中...</h1>
                    </div>
                    <!-- 未加载状态 -->
                    <div v-else="item.loadType === -1" class="vc-calendar-month-unload">
                        <h1>{{item.date.getMonth()+1}}</h1>
                    </div>
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
    data: () => ({
        display: false,
        tag: Math.random().toString(36).substr(2),
        scrollTop: 0,
        calendars: [],
        range: [],
        i18n: null,
        publicWeek: null,
        // 默认配置
        opt: {
            showPrevNextDate: false, //上下月是否展示
            minDate: null,
            maxDate: null,
            week: 0, //一周星期几开始 0-7[星期日-星期一]
            language: 'zh',
            view: 3,
            publicWeek: true, //公用周标题
            format: "YYYY年MM月",
            cache: 3, //缓存3个月份
        },
        // 文案
        copywriter: {
            'zh': {
                weekdaysShort: ['日', '一', '二', '三', '四', '五', '六']
            },
            'en': {
                weekdaysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
            }
        },
        // ===========test=========
        topHeight: 0,
        bottomHeight: 0,
        isCache: true,

    }),
    methods: {
        init(option) {
            // 初始化
            const {
                copywriter,
                opt,
                isType,
                clearTime,
                getTimeOfclearTime,
                getIntervalMonth
            } = this;
            // merge 配置
            const config = { ...opt,
                ...option
            };
            // 这时候拿到的config并不一定全是正确配置
            this.minDateTime = getTimeOfclearTime(config.minDate);
            this.maxDateTime = getTimeOfclearTime(config.maxDate);
            this.i18n = copywriter[config.language];
            this.fixDate = new Date();
            this.week = /^[0-6]$/g.test(config.week) ? opt.week : 0;
            this.view = 4; //插件默认渲染多少月份[其他月份按需加载计算]
            this.cache = config.cache; //缓存月份
            this.publicWeek = !!config.publicWeek;
            this.showPrevNextDate = !!config.showPrevNextDate;
            this.format = config.format;
            this.countMonth = getIntervalMonth(config.minDate, config.maxDate);

            // console.log(this.countMonth);
        },
        /*====test===*/
        getIntervalMonth(startDate, endDate){
            const startMonth = startDate.getMonth();
            const endMonth = endDate.getMonth();
            return Math.abs((startDate.getFullYear()*12+startMonth)-(endDate.getFullYear()*12+endMonth))+1;
        },
        /*====test===*/
        onScroll(e) {
            const currentScrollTop = e.target.scrollTop;
            // const scrollHeight = document.getElementById(`scroll-${this.tag}`).offsetHeight;
            if (currentScrollTop > this.scrollTop) {
                // 向下滚动
                console.log("===内容向上滚动===");
                const offsetHeight = document.getElementById(this.getAnchor(this.calendars[2].date)).offsetTop;
                if (offsetHeight < currentScrollTop) {
                    /*===方案一 电脑可以：移动端不行====*/
                    /*this.isCache = false;
                    const fh = document.getElementById(this.getAnchor(this.calendars[0].date)).offsetHeight;
                    const sh = document.getElementById(this.getAnchor(this.calendars[1].date)).offsetHeight;
                    const th = document.getElementById(this.getAnchor(this.calendars[2].date)).offsetHeight;
                    this.topHeight += fh;
                    this.topHeight += sh;
                    this.topHeight += th;
                    // 移除
                    const m = this.calendars.shift();
                    this.calendars.push(m);

                    const n = this.calendars.shift();
                    this.calendars.push(n);

                    const k = this.calendars.shift();
                    this.calendars.push(k);

                    this.isCache = true;*/

                    /*===方案二====*/
                    /*console.log("===方案二====");
                    this.isCache = false;
                    const fh = document.getElementById(this.getAnchor(this.calendars[0].date)).offsetHeight;
                    this.scrollTop = 0;
                    const n = this.calendars.shift();
                    this.calendars.push(n)
                    this.isCache = true;*/
                } else {
                    // this.scrollTop = currentScrollTop;


                }
                const lastOffsetTop = document.getElementById(this.getAnchor(this.calendars[(this.calendars.length - 1 - 2)].date)).offsetTop;


                console.log(lastOffsetTop, currentScrollTop);

            } else {
                // 向上滚动
                console.log("===内容向下滚动===");



            }
            this.scrollTop = currentScrollTop;
        },
        getScrollTop() {
            // console.log("in getScrollTop");
            return this.scrollTop;
        },
        render(date, range) {
            // 返回Promise 对象
            return new Promise((resolve, reject) => {
                this.calendars = [];
                if (this.isType(range, 'Array')) {
                    this.range = range;
                } else {
                    this.range = [];
                }
                let anchorDate;
                if (this.isType(date, 'Date')) {
                    anchorDate = date;
                } else {
                    // 去[回]程判断顺序都是 预选值 -> range[0]->range[1]-minDate
                    anchorDate = this.range[0] || this.range[1] || (!!this.minDateTime ? new Date(this.minDateTime) : new Date());
                }
                this.fixDate = anchorDate;
                // 重新获取今日时间戳
                this.todayDateTime = this.getTimeOfclearTime(new Date());
                this.createCalendars();
                this.show();
                //一定要异步否则无效,mounted无法保证组件全部已经在document中
                setTimeout(() => {
                    this.scrollTop = document.getElementById(this.getAnchor(anchorDate)).offsetTop || 0;
                }, 50);
                // 注册选择事件
                this.select = (date) => {
                    this.hide();
                    resolve(date);
                }
            });
        },
        createCalendars() {
            const {
                countMonth,
                fixDate,
                minDateTime,
                view,
                week,
                createTodayObj,
                getMaxDate,
                getDateOfArray
            } = this;
            const calendars = [];
            const fixDateArray = getDateOfArray(fixDate);
            const startDateArray = getDateOfArray(new Date(minDateTime));
            // console.log(startDateArray);
            // const rangeView = [new Date(fixDateArray[0], fixDateArray[1], 1), new Date(fixDateArray[0], fixDateArray[1]+view-1, 1)];
            const rangeStartTime = new Date(fixDateArray[0], fixDateArray[1], 1).getTime();
            const rangeEndTime = new Date(fixDateArray[0], fixDateArray[1]+view-1, 1).getTime();
            console.log(rangeStartTime, rangeEndTime);
            /*===test===*/
            for(let i = 0, l = countMonth; i < l; i++){
                // minDate-maxDate 一共渲染countMonth月份 1.在当前定位月份中 2.非当前定位月份中(按需加载)
                let currentViewDate = new Date(startDateArray[0], startDateArray[1] + i, 1);
                console.log(currentViewDate);
                if( currentViewDate.getTime() >= rangeStartTime && currentViewDate.getTime() <= rangeEndTime){
                    // 1.在当前定位月份中
                    calendars.push(this.createCalendarsOfView(currentViewDate));
                }else{
                    // 2.非当前定位月份中(按需加载)
                    calendars.push({
                        date : currentViewDate,
                        data : [],
                        loadType : -1, //-1-未加载 0-加载中 1-加载完成(可以加载)
                    });
                }
            }



            this.calendars = calendars;


            return;

            /*===test===*/
            for (let i = 0, l = view; i < l; i++) {
                let currentViewDate = new Date(fixDateArray[0], fixDateArray[1] + i, 1);
                let currentYear = currentViewDate.getFullYear();
                let currentMonth = currentViewDate.getMonth();
                let weekdayOfFirstDay = currentViewDate.getDay();
                let daysOfLastMonth = (weekdayOfFirstDay - week + 7) % 7;
                let maxDateOfCurrentMonth = getMaxDate(currentYear, currentMonth);
                let month = []; //月
                // 上月填补天数
                if (daysOfLastMonth > 0) {
                    let maxDateOfLastMonth = getMaxDate(currentYear, currentMonth - 1);
                    for (let n = (maxDateOfLastMonth - daysOfLastMonth + 1), m = maxDateOfLastMonth; n <= m; n++) {
                        const currentDate = new Date(currentYear, currentMonth - 1, n);
                        month.push(createTodayObj(currentDate, -1, n));
                    }
                }
                // 当前月
                for (let n = 1, m = maxDateOfCurrentMonth; n <= m; n++) {
                    const currentDate = new Date(currentYear, currentMonth, n);
                    month.push(createTodayObj(currentDate, 0, n));
                }
                // 下月
                if (month.length % 7 != 0) {
                    // 非6*7计算(如果按照6*7计算则m=6*7-month.length)
                    for (let n = 1, m = (7 - month.length % 7); n <= m; n++) {
                        const currentDate = new Date(currentYear, currentMonth + 1, n);
                        month.push(createTodayObj(currentDate, 1, n));
                    }
                }

                this.calendars.push({
                    date: currentViewDate,
                    data: month
                })
            }
        },
        createCalendarsOfView(currentViewDate){
            const {
                week,
                createTodayObj,
                getMaxDate
            } = this;
            // 渲染月份日历
            let currentYear = currentViewDate.getFullYear();
            let currentMonth = currentViewDate.getMonth();
            let weekdayOfFirstDay = currentViewDate.getDay();
            let daysOfLastMonth = (weekdayOfFirstDay - week + 7) % 7;
            let maxDateOfCurrentMonth = getMaxDate(currentYear, currentMonth);
            let month = []; //月
            // 上月填补天数
            if (daysOfLastMonth > 0) {
                let maxDateOfLastMonth = getMaxDate(currentYear, currentMonth - 1);
                for (let n = (maxDateOfLastMonth - daysOfLastMonth + 1), m = maxDateOfLastMonth; n <= m; n++) {
                    const currentDate = new Date(currentYear, currentMonth - 1, n);
                    month.push(createTodayObj(currentDate, -1, n));
                }
            }
            // 当前月
            for (let n = 1, m = maxDateOfCurrentMonth; n <= m; n++) {
                const currentDate = new Date(currentYear, currentMonth, n);
                month.push(createTodayObj(currentDate, 0, n));
            }
            // 下月
            if (month.length % 7 != 0) {
                // 非6*7计算(如果按照6*7计算则m=6*7-month.length)
                for (let n = 1, m = (7 - month.length % 7); n <= m; n++) {
                    const currentDate = new Date(currentYear, currentMonth + 1, n);
                    month.push(createTodayObj(currentDate, 1, n));
                }
            }

            return{
                date: currentViewDate,
                data: month,
                loadType : 1, //-1-未加载 0-加载中 1-加载完成(可以加载)
            }
        },
        createTodayObj(date, type, day) {
            const {
                minDateTime,
                maxDateTime,
                todayDateTime
            } = this;
            const r = {
                date,
                day,
                type,
                isAvailable: type == 0 || false, // 是否有效(上下月都是无效的)
                isToday: false //是否今天
            }
            const currentDateTime = date.getTime();
            // 是否有效(在minDate、maxDate之间)
            if ((!!minDateTime && currentDateTime < minDateTime) || (!!maxDateTime && currentDateTime > maxDateTime)) {
                r.isAvailable = false;
            }
            // 是否今日
            if (currentDateTime === todayDateTime) {
                r.isToday = true;
            }
            return r;
        },
        createClass(data) {
            const {
                range
            } = this;
            const className = [];
            const currTime = data.date.getTime();
            const rangeStartTime = !!range[0] ? range[0].getTime() : null;
            const rangeEndTime = !!range[1] ? range[1].getTime() : null;
            // 今日
            data.isToday && className.push('today');
            // 选中
            if (currTime === rangeStartTime || currTime === rangeEndTime) {
                className.push('selected');
            }
            // 经过
            if (!!rangeStartTime && !!rangeEndTime && currTime > rangeStartTime && currTime < rangeEndTime) {
                className.push('range');
            }
            return className;
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
        getAnchor(date) {
            let m = date.getMonth() + 1;
            m = m > 9 ? m : `0${m}`;
            return `${this.tag}_${date.getFullYear()}${m}`;
        },
        getMaxDate(year, month) {
            // 获取当前年月的最大天数
            return new Date(new Date(year, month + 1, 1).getTime() - 1 * 24 * 60 * 60 * 1000).getDate();
        },
        getDateOfArray(date) {
            // return this.isDate(date) ? [date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()] : [];
            return this.isType(date, 'Date') ? [date.getFullYear(), date.getMonth(), date.getDate()] : [null, null, null];
        },
        getDateOfclearTime(date){
            // 清除时间后的日期对象
            return this.isType(date, 'Date') ? new Date(date.getFullYear(), date.getMonth(), 1) : null;
        },
        getTimeOfclearTime(date) {
            // 清除时间后的时间戳
            return this.isType(date, 'Date') ? new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() : null;
        },
    }
}
</script>
<style lang="scss" scoped>
@import './calendar.beta.scss'
</style>
