import CalendarComponent from './calendar.beta.1.vue'

const Calendar = {};

Calendar.install = (Vue)=>{
    const CalendarConstructor = Vue.extend(CalendarComponent);
    Vue.prototype.$Calendar = (option)=>{
        // 实例化对象
        const instance = new CalendarConstructor(option);
        instance.$mount(document.createElement('div'));
        document.body.appendChild(instance.$el);
        // 初始化
        instance.init(option);
        // 返回实例
        return instance;
    }
}

export default Calendar
