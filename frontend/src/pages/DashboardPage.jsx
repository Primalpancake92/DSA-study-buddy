import { Link } from 'react-router-dom';
import { dailyRoutine, weeklyRhythm } from '../../../shared/schedule.js';
import { useLearningData, moduleProgress } from '../hooks/useLearningData.js';
import { recommendNextLesson } from '../services/learningRecommendations.js';
import { useAccountSettings } from '../components/AccountSettingsProvider.jsx';
import { LearningReminders } from '../components/LearningReminders.jsx';

export function DashboardPage() {
    const { settings } = useAccountSettings();
    const studyGoal = settings.learning.dailyMinutes;
    const routine = dailyRoutine.map(([name, minutes, detail], index) => [
        name,
        index === dailyRoutine.length - 1
            ? studyGoal -
              dailyRoutine
                  .slice(0, -1)
                  .reduce((sum, item) => sum + Math.floor((item[1] * studyGoal) / 60), 0)
            : Math.floor((minutes * studyGoal) / 60),
        detail
    ]);
    const { weeks, progress, loading, error } = useLearningData();
    const recommendation = recommendNextLesson(weeks, progress);
    const currentWeek = weeks.find((week) => week.id === recommendation.lesson?.weekId);
    const currentProgress = currentWeek ? moduleProgress(currentWeek, progress) : null;
    const overall = weeks.reduce(
        (total, week) => {
            const status = moduleProgress(week, progress);
            return {
                completed: total.completed + status.completed,
                total: total.total + status.total
            };
        },
        { completed: 0, total: 0 }
    );
    const programmeProgress = currentProgress || {
        ...overall,
        percentage: overall.total ? Math.round((overall.completed / overall.total) * 100) : 0
    };
    const destination = recommendation.href || '/app/roadmap';
    return (
        <div className="page dashboard">
            <div className="page-intro">
                <div>
                    <div className="eyebrow">YOUR LEARNING SPACE</div>
                    <h1>Good morning.</h1>
                    <p>
                        Keep the chain simple today: understand one thing, solve one thing, explain
                        one thing.
                    </p>
                </div>
                <Link className="button primary" to={destination}>
                    Start today's session <span>↗</span>
                </Link>
            </div>
            <LearningReminders />
            <div className="dashboard-grid">
                <section className="progress-card">
                    <div className="section-kicker">YOUR PROGRAMME</div>
                    <h2>
                        {currentWeek
                            ? `Module ${String(currentWeek.sequence).padStart(2, '0')}`
                            : 'Your curriculum'}{' '}
                        <span>/ {weeks.length || '…'}</span>
                    </h2>
                    <p>{currentWeek?.title || 'Explore your saved learning progress'}</p>
                    <div className="progress-bar">
                        <i style={{ width: `${programmeProgress.percentage}%` }} />
                    </div>
                    <small>
                        {programmeProgress.total
                            ? `${programmeProgress.completed} of ${programmeProgress.total} lessons complete`
                            : 'View your curriculum on the roadmap'}
                    </small>
                    <Link className="inline-link" to={destination}>
                        Continue learning →
                    </Link>
                </section>
                <section className="routine-card">
                    <div className="section-kicker">
                        TODAY'S PLAN · {studyGoal} MIN · {settings.learning.daysPerWeek} DAYS/WEEK
                    </div>
                    {routine.map(([name, minutes, detail], index) => (
                        <div className="routine-row" key={name}>
                            <span className={`routine-number n${index + 1}`}>{index + 1}</span>
                            <div>
                                <strong>{name}</strong>
                                <small>{detail}</small>
                            </div>
                            <em>{minutes}m</em>
                        </div>
                    ))}
                </section>
            </div>
            <section className="today-panel">
                <div>
                    <div className="section-kicker">NEXT RECOMMENDED</div>
                    <h2>
                        {loading
                            ? 'Loading your next lesson…'
                            : error || progress.error
                              ? 'Could not load your saved learning progress'
                              : recommendation.state === 'complete'
                                ? 'Congratulations! You completed every available lesson.'
                                : recommendation.lesson?.title ||
                                  'No lessons are currently available'}
                    </h2>
                    {recommendation.lesson && !loading && !error && !progress.error && (
                        <p>
                            Module {String(recommendation.lesson.sequence).padStart(2, '0')} ·{' '}
                            {recommendation.lesson.category} ·{' '}
                            {recommendation.lesson.estimatedMinutes} min estimated
                        </p>
                    )}
                </div>
                {!loading && (
                    <Link
                        className="button dark"
                        to={error || progress.error ? '/app/roadmap' : destination}
                    >
                        {recommendation.state === 'ready' && !error
                            ? recommendation.continuing
                                ? 'Continue lesson'
                                : 'Start lesson'
                            : 'View progress'}
                    </Link>
                )}
            </section>
            <div className="rhythm">
                <div className="section-kicker">WEEKLY RHYTHM</div>
                {weeklyRhythm.map((day, index) => (
                    <div className={`rhythm-day ${index === 3 ? 'current' : ''}`} key={day}>
                        <span>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</span>
                        <small>{day}</small>
                    </div>
                ))}
            </div>
        </div>
    );
}
