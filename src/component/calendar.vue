<template>
<div id="calendar-section"  @scroll.passive="onScroll">
  <div class="calendar-table-option" v-for="(item, index) in calendars">
    <div class="calendar-table-title">{{`${item.date.getFullYear()}年${item.date.getMonth() < 9 ? `0${item.date.getMonth()+1}` : item.date.getMonth()+1 }月`}}</div>
    <table class="calendar-table">
      <thead>
        <tr>
          <th v-for="(item, index) in 7">{{option.i18n.weekdaysShort[(weekStart+index)%7]}}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(weekItem, weekIndex) in item.data">
          <template v-for="(dayItem, dayIndex) in weekItem">
            <td v-if="dayItem.t == 1 && dayItem.c == 0" :class="{'prev' : dayItem.c == -1,
                        'curr' : dayItem.c == 0,
                        'next' : dayItem.c == 1,
                        'primary':dayItem.s == 1 && dayItem.c == 0,
                        'unavailable' : dayItem.t == 0 ,
                        'today' : dayItem.today
                    }"
                @click="choose(item.date.getFullYear(), item.date.getMonth(), dayItem.d)">
              <span>{{dayItem.d}}</span>
            </td>
            <td v-else :class="{'prev' : dayItem.c == -1,
                        'curr' : dayItem.c == 0,
                        'next' : dayItem.c == 1,
                        'primary':dayItem.s == 1 && dayItem.c == 0,
                        'unavailable' : dayItem.t == 0 ,
                        'today' : dayItem.today
                        }">
              <span>{{dayItem.d}}</span>
            </td>
          </template>
        </tr>
      </tbody>
    </table>
  </div>
</div>
</template>
<script>
export default {
  name: "Calendar",
  props: {
    // 最小日期
    minDate: {
      type: Date,
      default: null,
      required: false
    },
    // 最大日期
    maxDate: {
      type: Date,
      default: null,
      required: false
    },
    // 展示定位月份(主要是用于初始没有值得时候定位月份)
    fixDate: {
      type: Date,
      default: () => (new Date()),
      required: false
    },
    //一周从哪一天开始。0-（星期日）到6（星期六） 1-（周一至周日）
    weekStart: {
      type: Number,
      default: 0,
      required: false
    },
    //输出日期格式
    format: {
      type: String,
      default: "yyyy-MM-dd",
      required: false
    },
    // 默认语言
    language: {
      type: String,
      default: 'zh',
      required: false
    },
    // 选择出发事件
    select: {
      type: Function,
      default: () => {},
      required: false
    },
    // 渲染展示月份3个
    view: {
      type: Number,
      default: 12,
      required: false
    },
    // 缓存日期个数 2 个
    cache: {
      type: Number,
      default: 3,
      required: false
    }
  },
  data: () => ({
    calendars: [],
    primaryVal: null, //预选值 并不是选中的值
    i18n: {
      'zh': {
        weekdaysShort: ['日', '一', '二', '三', '四', '五', '六']
      },
      'en': {
        weekdaysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      }
    },
    // 最终使用的配置
    option: {

    }
  }),
  mounted() {
    this.init();

  },
  methods: {
    changeFn(data) {
      // 改变父组件值
      this.$emit('input', data);
    },
    init() {
      const {
        minDate,
        maxDate,
        fixDate,
        option,
        i18n,
        language,
        clearTime
      } = this;
      this.option.minDate = minDate ? clearTime(minDate) : null;
      this.option.maxDate = maxDate ? clearTime(maxDate) : null;
      this.option.fixDate = fixDate ? clearTime(fixDate) : null;
      this.option.i18n = i18n[language];
    },
    choose(y, m, d) {
      console.log(y, m, d);
      const chooseDate = new Date(y, m, d);
      // this.primaryVal = chooseDate;
      this.changeFn(chooseDate);
    },
    onScroll(e){
        // console.log('in', e.target.scrollTop);
    },
    render(date) {
        this.calendars = [];
      const {
        clearTime
      } = this;
      const {
        minDate,
        maxDate
      } = this.option;
      if (Object.prototype.toString.call(date) === "[object Date]") {
        this.option.fixDate = clearTime(date) || new Date();
        this.primaryVal = clearTime(date); //预选值
        console.log(date);
      }
      console.log('in my Calendar render.');
      this.getCalendars();

    },
    getCalendars() {
      const {
        view,
        getMaxDate
      } = this;
      const {
        fixDate
      } = this.option;
      let fy = fixDate.getFullYear(), //定位年份
        fm = fixDate.getMonth(); //定位月份 [注意：fm == 比实际月份-1]
      let calendars = [];
      for (let i = 0, l = view; i < l; i++) {
        let sm = (fm + i) % 12; //当前渲染view的月份
        let sy = fy + parseInt((fm * 1 + i) / 12); //当前渲染view的年份
        let viewDate = new Date(sy, sm, 1);
        let weekdayOfMonth = viewDate.getDay(); //当前渲染view的月份第一天周几
        let daysOfPrevMonth = (weekdayOfMonth - this.weekStart + 7) % 7; //当前渲染view的月份需要上月填补多少天
        let maxDays = getMaxDate(sy, sm + 1); //当前渲染view的月份最大天数
        let data = []; //月
        let weeks = []; //周
        let dayCount = 0;
        /*========上月===========*/
        if (daysOfPrevMonth > 0) {
          let maxDaysOfPrevMonth = getMaxDate(sy, sm); //上一个月最大天数
          for (var Pi = maxDaysOfPrevMonth - daysOfPrevMonth + 1, Pl = maxDaysOfPrevMonth; Pi <= Pl; Pi++) {
            var n = this.getViewType(new Date(sy, sm - 1, Pi));
            n.d = Pi; //号数
            n.c = -1; // -1-上月日期，0-当月日期，1-下月日期
            if (weeks.length == 7) {
              data.push(weeks);
              weeks = [];
            }
            dayCount++;
            weeks.push(n);
          }
        }
        /*========本月===========*/
        for (var Li = 1, Ll = maxDays; Li <= Ll; Li++) {
          var n = this.getViewType(new Date(sy, sm, Li));
          n.d = Li;
          n.c = 0; // -1-上月日期，0-当月日期，1-下月日期
          if (weeks.length == 7) {
            data.push(weeks);
            weeks = [];
          }
          dayCount++;
          weeks.push(n);
        }

        /*========下月===========*/

        for (var Ni = 1, Nl = 42 - dayCount; Ni <= Nl; Ni++) {
          var n = this.getViewType(new Date(sy, sm, Li));
          n.d = Ni;
          n.c = 1; // -1-上月日期，0-当月日期，1-下月日期
          if (weeks.length == 7) {
            data.push(weeks);
            weeks = [];
          }
          weeks.push(n);
        }
        // console.log(data);
        this.calendars.push({
          date: viewDate,
          data: data
        })

      }


    },
    getViewType: function(currDate) {
      let currDateTime = currDate.getTime();
      let minDateTime = !!this.option.minDate ? this.option.minDate.getTime() : null; //最小日期
      let maxDateTime = !!this.option.maxDate ? this.option.maxDate.getTime() : null; //最大日期
      let primaryTime = !!this.primaryVal ? this.primaryVal.getTime() : null; //预选值
      let todayTime = this.clearTime(new Date()).getTime(); //今天的日期time
      // var selectedStartTime = !!this.selected[0] && this.selected[0].getTime(); //选中的开始日期
      // var selectedEndTime = this.pickerType > 0 && !!this.selected[1] && this.selected[1].getTime(); //选中的结束日期
      let type = {
        t: 1, // 0-不可用 1-可用
        s: 0, //0-非预选 1-预选
        today: false, //是否是今日
      };
      // 是否可用
      if ((!!minDateTime && currDateTime < minDateTime) || (!!maxDateTime && currDateTime > maxDateTime)) {
        type.t = 0;
      }
      if (!!primaryTime && primaryTime === currDateTime) {
        // 预选值
        type.s = 1;
      }
      if (currDateTime === todayTime) {
        type.today = true;
      }

      // 选中类型
      // if( !!selectedStartTime && selectedStartTime == currDateTime ){
      //     // 开始选中
      //     type.s = 1;
      // }else if(!!selectedEndTime && selectedEndTime == currDateTime){
      //     // 结束选中
      //     type.s = 3;
      // }else if( !!selectedStartTime && !!selectedEndTime && currDateTime > selectedStartTime && currDateTime < selectedEndTime){
      //     // 经过
      //     type.s = 2;
      // }
      return type;
    },
    getMaxDate: function(y, m) {
      // 获取当前年月最大天数
      return new Date(new Date(y, m, 1).getTime() - 1 * 24 * 60 * 60 * 1000).getDate();
    },
    clearTime(date) {
      // 清楚时间的日期
      const y = date.getFullYear(),
        m = date.getMonth(),
        d = date.getDate();
      return new Date(y, m, d) || null;
    }
  }
}
</script>
<style lang="scss" scoped>
@import './calendar.scss'
</style>
