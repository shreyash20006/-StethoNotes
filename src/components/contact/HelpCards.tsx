import { CreditCard, Inbox, Download, UserCheck } from 'lucide-react';

interface HelpCardsProps {
  onFormScroll: () => void;
  onFaqScroll: () => void;
}

export default function HelpCards({ onFormScroll, onFaqScroll }: HelpCardsProps) {
  const helpers = [
    {
      icon: <CreditCard className="w-5 h-5 text-primary" />,
      title: "Payment Issues",
      desc: "Razorpay failure, double charges, or pending verification status.",
      action: onFormScroll,
      label: "Contact Payments Support"
    },
    {
      icon: <Inbox className="w-5 h-5 text-primary" />,
      title: "Email Delivery Issues",
      desc: "Didn't receive notes email, spam delivery, or wrong email spelling.",
      action: onFaqScroll,
      label: "Lookup Order FAQ"
    },
    {
      icon: <Download className="w-5 h-5 text-primary" />,
      title: "Download Problems",
      desc: "Expired link key, PDF load failure, or rendering errors on mobile.",
      action: onFaqScroll,
      label: "View Download Guides"
    },
    {
      icon: <UserCheck className="w-5 h-5 text-primary" />,
      title: "Account Help",
      desc: "Login troubleshooting, profile updates, or password/OTP issues.",
      action: onFormScroll,
      label: "Contact Account Team"
    }
  ];

  return (
    <section className="py-12 bg-void border-y border-white/5 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
            How can we help you?
          </h2>
          <p className="text-muted text-xs sm:text-sm mt-2">
            Select a category to jump directly to troubleshooting steps or open a support request.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {helpers.map((help, idx) => (
            <div
              key={idx}
              className="glass-card-v2 bg-card/65 border border-white/10 rounded-2xl p-6 shadow-2xl hover:border-primary/30 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center mb-4">
                  {help.icon}
                </div>
                <h4 className="font-display font-bold text-sm sm:text-base text-white mb-2">
                  {help.title}
                </h4>
                <p className="text-muted text-xs leading-relaxed mb-6">
                  {help.desc}
                </p>
              </div>
              <button
                onClick={help.action}
                className="w-full py-2.5 bg-white/5 hover:bg-primary/25 hover:text-primary border border-white/5 rounded-xl text-white font-display font-bold text-xs text-center transition-all"
              >
                {help.label}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
